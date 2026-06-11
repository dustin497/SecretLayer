; Inno Setup script — combined PrivateLayer installer
; Compile: iscc scripts\installer\PrivateLayer.iss
; Or use build-combined-installer.ps1 (auto-detects Inno Setup)

#define MyAppName "PrivateLayer"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "PrivateLayer"
#define MyAppURL "https://github.com/dustin497/SecretLayer"
#define MyAppExeName "PrivateLayer.exe"
#define StagingDir "..\..\dist\staging"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={localappdata}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=..\..\dist
OutputBaseFilename=PrivateLayer-Setup-{#MyAppVersion}
SetupIconFile=..\..\apps\desktop\src-tauri\icons\icon.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create desktop shortcut"; GroupDescription: "Shortcuts:"; Flags: checked

[Files]
Source: "{#StagingDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\scripts\start-private-layer.ps1"; Parameters: "-ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\scripts\start-private-layer.ps1"" -InstallDir ""{app}"" -InstalledExe ""{app}\{#MyAppExeName}"""; IconFilename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\scripts\start-private-layer.ps1"; Parameters: "-ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\scripts\start-private-layer.ps1"" -InstallDir ""{app}"" -InstalledExe ""{app}\{#MyAppExeName}"""; IconFilename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; WorkingDir: "{app}"

[Run]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\post-install.ps1"" -InstallDir ""{app}"""; StatusMsg: "Setting up local agent and checking Ollama..."; Flags: waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\agent\.venv"

[Code]
function InitializeSetup(): Boolean;
begin
  if not FileExists(ExpandConstant('{#StagingDir}\PrivateLayer.exe')) then
  begin
    MsgBox('Staging folder missing. Run build-combined-installer.ps1 first.', mbError, MB_OK);
    Result := False;
  end
  else
    Result := True;
end;
