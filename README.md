
# Fixetta 📸🏠 - AI Home Repair Estimator

Fixetta is a modern, mobile-first web application that uses AI to instantly identify home repair issues from photos, estimate costs, and connect homeowners with verified local professionals.

## 🚀 Features

- **📸 Multi-Photo Capture:** Upload up to 4 images for highly accurate AI analysis.
- **🤖 Instant AI Estimates:** Detect objects, calculate material/labor costs, and assess repair complexity in seconds.
- **👷🏻‍♂️ Vetted Pro Matching:** Browse top-rated local professionals with real-time availability.
- **🏠 Homeowner Vault:** Store home specs for 2x more accurate quotes.
- **📱 Fully Responsive:** Built mobile-first with smooth animations and intuitive navigation.

## 📦 Setup & Local Development

This project uses vanilla React via Import Maps, meaning **no `npm install` or build steps are required** to run it locally!

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/fixetta.git
   cd fixetta
   ```

2. **Run a local server:**
   Because of browser security policies (CORS), you need to serve the files over HTTP, not open `index.html` directly.
   
   *Option A: Python (Built-in)*
   ```bash
   python3 -m http.server 3000
   ```
   *Option B: Node.js (npx)*
   ```bash
   npx serve .
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`.

## 🌐 Deploy to GitHub Pages (Free Hosting)

The easiest way to host this app is via GitHub Pages:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Fixetta AI Home Repair"
   git remote add origin https://github.com/YOUR_USERNAME/fixetta.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository settings on GitHub (`Settings > Pages`).
   - Under **Source**, select `Deploy from a branch`.
   - Select `main` branch and `/ (root)` folder.
   - Click **Save**.

GitHub will automatically publish your app. You can find the live URL in the **Pages** section (usually `https://yourusername.github.io/fixetta/`).

## 🛠️ Project Structure

```text
├── index.html              # Main entry point with React Import Map
├── README.md               # You are here!
└── src/
    ├── App.js              # Main routing & state logic
    ├── App.css             # Global styles, CSS variables & animations
    ├── index.js            # React DOM mount
    ├── components/         # Reusable UI (Bounding Box, Photo Capture, etc.)
    ├── screens/            # Full-page views (Home, Pros, Projects, Profile)
    ├── utils/              # Storage helpers & AI pipeline logic
    └── data/               # Mock data, rates, and pro listings
```

## 📝 Technologies Used

- **React 18** (via ESM / Import Maps)
- **CSS3** (Variables, Flexbox, Grid, Animations)
- **Vanilla JS** (ES Modules)
- **No Node.js or Bundlers required**

---
*Built with ❤️ for modern homeowners looking for fast, transparent repairs.*
