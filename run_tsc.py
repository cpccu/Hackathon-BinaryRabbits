import subprocess
try:
    result = subprocess.run(['npx', 'tsc', '--noEmit'], cwd='/home/Rabbit/Project/CampusOS/cu-compass', capture_output=True, text=True)
    with open('/home/Rabbit/Project/CampusOS/cu-compass/tsc_output.txt', 'w') as f:
        f.write(result.stdout)
        f.write(result.stderr)
except Exception as e:
    with open('/home/Rabbit/Project/CampusOS/cu-compass/tsc_output.txt', 'w') as f:
        f.write(str(e))
