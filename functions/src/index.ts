import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

export const verifyQRCheckin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerId = context.auth.uid;
  const callerDoc = await db.collection('users').doc(callerId).get();
  const role = callerDoc.data()?.role;

  if (role !== 'admin' && role !== 'club_executive') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins or club executives can verify check-ins.');
  }

  const { qrToken, eventId } = data;
  if (!qrToken || !eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing qrToken or eventId.');
  }

  const regsRef = db.collection('eventRegistrations');
  const snapshot = await regsRef
    .where('eventId', '==', eventId)
    .where('qrToken', '==', qrToken)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Registration not found for the given token and event.');
  }

  const doc = snapshot.docs[0];
  const regData = doc.data();

  if (regData.attendanceStatus === 'attended') {
    throw new functions.https.HttpsError('already-exists', 'User has already checked in.');
  }

  const userName = regData.userName || 'Student';

  await doc.ref.update({
    attendanceStatus: 'attended',
    checkedInAt: admin.firestore.Timestamp.now(),
    checkedInBy: callerId
  });

  return { success: true, userName, registrationId: doc.id };
});

export const setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (callerDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set user roles.');
  }

  const { userId, newRole } = data;
  if (!userId || !newRole) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing userId or newRole.');
  }

  const validRoles = ['student', 'cr', 'faculty', 'club_executive', 'admin'];
  if (!validRoles.includes(newRole)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role provided.');
  }

  await db.collection('users').doc(userId).update({
    role: newRole,
    updatedAt: admin.firestore.Timestamp.now()
  });

  return { success: true };
});

// Notifications triggers
export const onComplaintStatusUpdate = functions.firestore
  .document('complaints/{complaintId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.status !== oldData.status && !newData.isAnonymous) {
      await db.collection('notifications').add({
        userId: newData.studentId,
        title: 'Complaint Status Updated',
        body: `Your complaint about ${newData.category} has been marked as ${newData.status}.`,
        link: `/complaints/${context.params.complaintId}`,
        isRead: false,
        createdAt: admin.firestore.Timestamp.now(),
        type: 'complaint_update'
      });
    }
  });

export const onOwnershipClaimStatusUpdate = functions.firestore
  .document('ownershipClaims/{claimId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.status !== oldData.status) {
      await db.collection('notifications').add({
        userId: newData.claimantId,
        title: 'Claim Status Updated',
        body: `Your claim for item ${newData.itemId} has been ${newData.status}.`,
        link: `/lost-found/${newData.itemId}`,
        isRead: false,
        createdAt: admin.firestore.Timestamp.now(),
        type: 'claim_update'
      });
    }
  });

export const onResourceVerification = functions.firestore
  .document('resources/{resourceId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.isVerified && !oldData.isVerified) {
      await db.collection('notifications').add({
        userId: newData.uploaderId,
        title: 'Resource Verified',
        body: `Your uploaded resource for ${newData.courseId} has been verified!`,
        link: `/resources/${context.params.resourceId}`,
        isRead: false,
        createdAt: admin.firestore.Timestamp.now(),
        type: 'resource_verified'
      });
    }
  });

// Scheduled tasks
export const expireNotices = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await db.collection('urgentNotices')
      .where('activeUntil', '<', now)
      .get();
      
    if (snapshot.empty) return null;
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return null;
  });
