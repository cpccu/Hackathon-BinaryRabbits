import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export function EventCheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<Array<{id: string, status: 'success'|'warning'|'error', message: string, time: string}>>([]);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });

  useEffect(() => {
    // Fetch stats
    const fetchStats = async () => {
      if (!eventId) return;
      const q = query(collection(db, 'eventRegistrations'), where('eventId', '==', eventId));
      const snap = await getDocs(q);
      let checkedIn = 0;
      snap.forEach(doc => {
        if (doc.data().attendanceStatus === 'attended') checkedIn++;
      });
      setStats({ total: snap.size, checkedIn });
    };
    fetchStats();
  }, [eventId]);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    
    scanner.render(async (decodedText) => {
      // Pause scanning after success to prevent multiple reads
      scanner.pause(true);
      await handleScan(decodedText);
      setTimeout(() => scanner.resume(), 2000);
    }, (error) => {
      // ignore
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scanning]);

  const handleScan = async (qrToken: string) => {
    try {
      const q = query(collection(db, 'eventRegistrations'), where('eventId', '==', eventId), where('qrToken', '==', qrToken));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        addScanResult('error', 'Invalid QR code. Registration not found.');
        return;
      }

      const regDoc = snap.docs[0];
      const data = regDoc.data();

      if (data.attendanceStatus === 'attended') {
        addScanResult('warning', 'Already checked in.');
        return;
      }

      await updateDoc(doc(db, 'eventRegistrations', regDoc.id), {
        attendanceStatus: 'attended',
        checkedInAt: new Date().toISOString()
      });

      addScanResult('success', 'Check-in successful!');
      setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
      toast.success('Attendee checked in successfully');
      
    } catch (error) {
      addScanResult('error', 'Network error during check-in.');
    }
  };

  const addScanResult = (status: 'success'|'warning'|'error', message: string) => {
    setRecentScans(prev => [{
      id: Math.random().toString(),
      status,
      message,
      time: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 5));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Event Check-in</h1>
          <p className="text-muted-foreground mt-1">Scan QR passes to mark attendance</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">Attendance</p>
          <p className="text-2xl font-bold text-primary">{stats.checkedIn} / {stats.total}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" /> QR Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!scanning ? (
              <Button onClick={() => setScanning(true)} className="w-full h-32 text-lg">
                Start Camera Scanner
              </Button>
            ) : (
              <div className="space-y-4">
                <div id="reader" className="w-full overflow-hidden rounded-lg border bg-muted"></div>
                <Button variant="outline" onClick={() => setScanning(false)} className="w-full">
                  Stop Scanner
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            {recentScans.length > 0 ? (
              <div className="space-y-3">
                {recentScans.map(scan => (
                  <div key={scan.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    {scan.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />}
                    {scan.status === 'warning' && <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />}
                    {scan.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                    <div>
                      <p className="font-medium text-sm">{scan.message}</p>
                      <p className="text-xs text-muted-foreground">{scan.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No scans yet. Start scanning to see results here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
