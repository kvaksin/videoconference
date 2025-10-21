# 🚀 Render.com Deployment Guide

This guide will help you deploy the WebRTC Video Conference application to Render.com.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to a GitHub repository
2. **Render Account**: Create a free account at [render.com](https://render.com)
3. **Domain (Optional)**: Custom domain if you want to use your own URL

## 🛠️ Deployment Steps

### 1. Connect GitHub Repository

1. Log into your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select your `videoconference` repository
5. Click "Connect"

### 2. Configure Service Settings

Use these settings in the Render deployment form:

- **Name**: `webrtc-videoconference` (or your preferred name)
- **Region**: Choose closest to your users (Oregon recommended)
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Environment Variables

Set these environment variables in Render:

**Required:**
- `NODE_ENV` = `production`
- `JWT_SECRET` = `your-secure-random-string-here` (generate a 64-character random string)
- `SESSION_SECRET` = `another-secure-random-string` (generate a 64-character random string)

**Optional:**
- `DB_PATH` = `/opt/render/project/src/database/videoconference.db`

**Generate Secure Secrets:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET  
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Configure Persistent Disk

1. In the "Advanced" section during setup:
2. Add a Disk:
   - **Name**: `videoconference-database`
   - **Mount Path**: `/opt/render/project/src/database`
   - **Size**: `1 GB` (minimum)

### 5. Deploy

1. Click "Create Web Service"
2. Wait for the deployment to complete (5-10 minutes)
3. Your app will be available at: `https://your-service-name.onrender.com`

## ⚙️ Post-Deployment Configuration

### 1. Change Default Admin Password

1. Visit your deployed application
2. Sign in with default credentials:
   - Email: `admin@videoconference.com`
   - Password: `admin123`
3. **Immediately change the password**

### 2. Test Core Features

- [ ] User registration and login
- [ ] Video calling functionality
- [ ] Chat messaging during calls
- [ ] Calendar features (for full license users)
- [ ] Admin panel access

### 3. Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domains"
3. Add your domain and configure DNS as instructed

## 🔧 Configuration Files

### render.yaml
The `render.yaml` file in your repository configures:
- Service type and environment
- Build and start commands
- Environment variables
- Persistent disk settings
- Health checks

### package.json Updates
Added for deployment:
- Node.js engine requirements
- Proper scripts configuration

## 📊 Monitoring and Maintenance

### Performance Monitoring
- Monitor your service in Render dashboard
- Check logs for errors or performance issues
- Consider upgrading plan for higher traffic

### Database Backup
- Render provides automatic backups on paid plans
- For manual backup, consider periodic database exports
- SQLite file is stored on persistent disk

### Scaling Options
- **Starter Plan**: 512MB RAM, 0.1 CPU cores
- **Standard Plan**: 2GB RAM, 1 CPU core
- **Pro Plan**: 4GB+ RAM, 2+ CPU cores

## 🛡️ Security Considerations

### Production Security
- [x] HTTPS automatically enabled by Render
- [x] Secure session secrets configured
- [x] JWT tokens with proper expiration
- [x] Rate limiting enabled
- [x] CORS configured
- [x] Security headers via Helmet.js

### Additional Security Steps
1. Change default admin credentials immediately
2. Regularly update dependencies
3. Monitor for security vulnerabilities
4. Consider IP whitelisting for admin panel

## 🔗 WebRTC Considerations

### STUN/TURN Servers
- App uses Google's public STUN servers
- For production, consider:
  - Dedicated TURN servers for better connectivity
  - Services like Twilio, Agora, or self-hosted TURN servers

### Firewall and Network
- Render automatically handles most network configuration
- WebRTC works well with Render's infrastructure
- Some corporate firewalls may block WebRTC traffic

## 🚨 Troubleshooting

### Common Issues

**Deployment Fails:**
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

**Database Issues:**
- Ensure persistent disk is properly mounted
- Check DB_PATH environment variable
- Verify write permissions

**Video Calling Problems:**
- Check browser console for WebRTC errors
- Ensure HTTPS is working (required for WebRTC)
- Test with different browsers/devices

**Authentication Problems:**
- Verify JWT_SECRET and SESSION_SECRET are set
- Check if cookies are being blocked
- Ensure HTTPS is working for secure cookies

### Debugging Tips
- Use Render's log viewer for server-side issues
- Check browser console for client-side errors
- Monitor network requests in browser dev tools

## 📞 Support Resources

- [Render Documentation](https://render.com/docs)
- [WebRTC Documentation](https://webrtc.org/getting-started/)
- [Socket.IO Documentation](https://socket.io/docs/)
- Application logs in Render dashboard

## 💰 Cost Estimation

### Free Tier Limitations
- Service sleeps after 15 minutes of inactivity
- Limited to 750 hours/month
- Suitable for development/testing

### Paid Plans
- **Starter**: $7/month - Always on, basic performance
- **Standard**: $25/month - Better performance, auto-scaling
- **Pro**: $85/month - High performance, advanced features

### Recommendations
- **Development**: Free tier
- **Small Team**: Starter plan
- **Business Use**: Standard or Pro plan

---

## 🎉 Deployment Complete!

Your WebRTC Video Conference application is now live on Render! 

Remember to:
- ✅ Change default admin password
- ✅ Test all features
- ✅ Monitor performance
- ✅ Set up custom domain (optional)
- ✅ Configure backups (paid plans)