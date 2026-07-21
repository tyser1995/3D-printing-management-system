' Launches the Next.js dev server hidden (no console window) on Windows logon.
' Registered as a Scheduled Task named "KAI3D-DevServer-AutoStart".
Set objShell = CreateObject("WScript.Shell")
projectDir = "D:\KAI3D\github\3D-printing-management-system"
cmd = "cmd /c cd /d """ & projectDir & """ && npm run dev >> logs\dev-server.log 2>&1"
objShell.Run cmd, 0, False
