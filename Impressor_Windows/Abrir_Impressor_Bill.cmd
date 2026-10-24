@echo off
setlocal
set "BILL_COMPILER=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%BILL_COMPILER%" set "BILL_COMPILER=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%BILL_COMPILER%" (
 echo O compilador do Microsoft .NET Framework nao foi localizado neste Windows.
 echo Envie esta mensagem para continuarmos a instalacao. Nenhuma impressao foi iniciada.
 pause
 exit /b 1
)
if not exist "%LOCALAPPDATA%\SaboresDoBillImpressor" mkdir "%LOCALAPPDATA%\SaboresDoBillImpressor"
"%BILL_COMPILER%" /nologo /target:winexe /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Web.Extensions.dll /out:"%LOCALAPPDATA%\SaboresDoBillImpressor\ImpressorBill.exe" "%~dp0ImpressorBill.cs"
if errorlevel 1 (
 echo Nao foi possivel preparar o programa. Envie uma foto desta tela.
 pause
 exit /b 1
)
start "" "%LOCALAPPDATA%\SaboresDoBillImpressor\ImpressorBill.exe"
