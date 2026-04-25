# Network Access Guide

## 🌐 Access Your App from Any Device

Your app is now configured to be accessible from multiple devices on your network and publicly via the internet.

---

## 📱 Local Network Access (Mobile & Other Devices)

### Step 1: Start the App with Network Access

Run one of these commands:

```bash
# Frontend only
npm run dev:network

# Frontend + Backend (recommended)
npm run dev:all:network
```

### Step 2: Find Your Local IP Address

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**Example Output:**
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

### Step 3: Access from Other Devices

Once you have your IP address, access the app from any device on the same network:

```
http://YOUR_IP_ADDRESS:5189
```

**Example:**
```
http://192.168.1.100:5189
```

**Important:** Make sure all devices are connected to the same Wi-Fi network!

---

## 🌍 Public URL Access (Internet Access)

To access your app from anywhere in the world, use **ngrok** (free tunneling service).

### Step 1: Install ngrok

Download from: https://ngrok.com/download

Or install via command:
```bash
# Using Chocolatey (Windows)
choco install ngrok

# Or download and extract manually
```

### Step 2: Start Your App

```bash
npm run dev:all:network
```

### Step 3: Create Public Tunnel

Open a new terminal and run:

```bash
ngrok http 5189
```

### Step 4: Get Your Public URL

ngrok will display something like:

```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:5189
```

**Your public URL:** `https://abc123.ngrok-free.app`

Share this URL with anyone - they can access your app from anywhere!

---

## 🔒 Security Notes

### Local Network Access
- ✅ Safe - only accessible on your local network
- ✅ No internet exposure
- ✅ Fast and reliable

### Public URL (ngrok)
- ⚠️ Accessible from anywhere on the internet
- ⚠️ Use only when needed
- ⚠️ Don't share sensitive data
- ⚠️ Free tier has session limits
- ✅ Great for demos and testing

---

## 📊 Access Summary

| Method | URL Format | Use Case |
|--------|-----------|----------|
| **Localhost** | `http://localhost:5189` | Development on your laptop |
| **Local Network** | `http://192.168.x.x:5189` | Access from phone/tablet on same Wi-Fi |
| **Public (ngrok)** | `https://xyz.ngrok-free.app` | Share with anyone, anywhere |

---

## 🐛 Troubleshooting

### Can't access from mobile?

1. **Check firewall:** Windows Firewall might be blocking port 5189
   - Go to Windows Defender Firewall → Allow an app
   - Add Node.js if not present

2. **Verify same network:** Both devices must be on the same Wi-Fi

3. **Try different IP:** Your computer might have multiple network adapters
   - Use `ipconfig` to find all IP addresses
   - Try each one

### ngrok not working?

1. **Sign up for free account:** https://dashboard.ngrok.com/signup
2. **Get auth token:** https://dashboard.ngrok.com/get-started/your-authtoken
3. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   ```

### Port already in use?

If port 5189 is busy, edit `vite.config.js` and change the port number.

---

## 🚀 Quick Start Commands

```bash
# Local development only
npm run dev

# Local network access (mobile + laptop)
npm run dev:all:network

# Then in another terminal for public access
ngrok http 5189
```

---

## 📞 Need Help?

- Check that your app is running (you should see the Vite dev server output)
- Verify your IP address is correct
- Make sure Windows Firewall allows Node.js
- Ensure all devices are on the same Wi-Fi network

---

**Happy Testing! 🎉**
