# Installing Git on Windows

## Option 1: Install Git for Windows (Recommended)

### Step 1: Download Git
1. Go to: https://git-scm.com/download/win
2. The download will start automatically
3. Or click "Click here to download manually"

### Step 2: Install Git
1. Run the downloaded installer (Git-2.x.x-64-bit.exe)
2. Click "Next" through the installation wizard
3. **Important Settings:**
   - **Editor**: Choose your preferred editor (VS Code, Notepad++, etc.)
   - **Default branch name**: Leave as "main" (recommended)
   - **PATH environment**: Choose "Git from the command line and also from 3rd-party software"
   - **Line ending conversions**: Choose "Checkout Windows-style, commit Unix-style line endings"
   - **Terminal emulator**: Choose "Use Windows' default console window"
   - **Default behavior**: Choose "Git Credential Manager" or "Git Credential Manager Core"

4. Click "Install" and wait for completion

### Step 3: Verify Installation
1. **Close and reopen PowerShell** (important!)
2. Run:
```powershell
git --version
```

You should see something like: `git version 2.x.x`

### Step 4: Configure Git (First Time Only)
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Option 2: Install via Winget (Windows Package Manager)

If you have Windows 10/11 with winget:

```powershell
winget install --id Git.Git -e --source winget
```

Then restart PowerShell and verify:
```powershell
git --version
```

## Option 3: Use GitHub Desktop (GUI Alternative)

If you prefer a graphical interface:

1. Download GitHub Desktop: https://desktop.github.com/
2. Install and sign in with your GitHub account
3. GitHub Desktop includes Git automatically
4. You can use it to:
   - Clone repositories
   - Commit changes
   - Push to GitHub
   - Create branches

## Troubleshooting

### Git still not recognized after installation

1. **Restart PowerShell/Terminal** (most common fix)
2. **Check PATH environment variable:**
   ```powershell
   $env:Path -split ';' | Select-String git
   ```
   Should show Git installation path

3. **Manually add to PATH:**
   - Open "Environment Variables" in Windows
   - Add: `C:\Program Files\Git\cmd`
   - Restart PowerShell

4. **Verify Git location:**
   ```powershell
   Test-Path "C:\Program Files\Git\bin\git.exe"
   ```

### Alternative: Use Git Bash

If PowerShell doesn't recognize Git, you can use Git Bash:
1. Search for "Git Bash" in Start menu
2. Open Git Bash terminal
3. Navigate to your project:
   ```bash
   cd /c/Users/moahm/OneDrive/Desktop/demoattendee
   ```

## After Installation

Once Git is installed, follow `GIT_SETUP.md` to:
1. Initialize your repository
2. Connect to GitHub
3. Set up CI/CD pipeline

## Quick Test

After installing, test Git with:
```powershell
git --version
git config --global --list
```

If both commands work, you're ready to proceed!

