# ATFCF App Deployment on Render

## 🚀 **Deployment Steps**

### **1. Backend API Service (Flask)**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `atfcf-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r atfcf_service/requirements.txt`
   - **Start Command**: `cd atfcf_service && python atfcf_service.py`
   - **Plan**: Free

### **2. Frontend Service (Node.js)**
1. Click "New +" → "Web Service" again
2. Configure:
   - **Name**: `atfcf-frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### **3. Update Configuration**
1. After deployment, copy your API service URL
2. Update `config.js` with your actual API URL:
   ```javascript
   production: {
     apiUrl: 'https://your-actual-api-url.onrender.com'
   }
   ```

### **4. Environment Variables**
- **Backend**: No additional env vars needed
- **Frontend**: No additional env vars needed

## 🔧 **What's Been Updated**

✅ **Flask Service**:
- Added CORS support
- Production-ready configuration
- Environment variable support for PORT
- Health check endpoint

✅ **Frontend**:
- Dynamic API URL configuration
- Environment-aware routing
- Removed hardcoded localhost URLs

✅ **Deployment Files**:
- `render.yaml` - Render configuration
- `Procfile` - Process specification
- `start.sh` - Startup script
- `requirements.txt` - Updated dependencies

## 🌐 **Access Your App**

- **Frontend**: `https://atfcf-frontend.onrender.com`
- **API**: `https://atfcf-api.onrender.com`

## 📝 **Notes**

- Both services use Render's free tier
- Auto-deploys on GitHub push
- CORS enabled for cross-origin requests
- Health check endpoint at `/health`
