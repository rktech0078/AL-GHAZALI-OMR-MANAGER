<p align="center">
  <img src="public/logo.svg" alt="Al-Ghazali OMR Manager" width="100%">
</p>

# Al-Ghazali OMR Manager

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)

**Al-Ghazali OMR Manager** is an AI-powered web application designed to revolutionize exam management in Pakistan. It eliminates the need for physical scanners by leveraging mobile cameras and AI technology to grade OMR sheets instantly.

## 🎯 Project Overview

This system allows schools to generate, scan, and grade OMR sheets using just a smartphone. It uses a hybrid approach:
1.  **Traditional Computer Vision (OpenCV/Libraries)** for fast and accurate processing.
2.  **Gemini AI Fallback** for handling complex or unclear images where traditional methods fail.

## 🚀 Key Features

*   **📱 Mobile-First Scanning**: Capture OMR sheets directly from your phone's camera.
*   **📄 PDF Generation**: Automatically generate A4 OMR sheets with unique QR/Barcodes.
*   **🧠 Hybrid Processing**: Uses OpenCV for speed and Gemini AI for robustness.
*   **👥 Role-Based Access**:
    *   **Admin**: Full system control.
    *   **Teacher**: Create exams, generate sheets, view results.
    *   **Student**: View their own results and performance.
*   **📊 Analytics**: Detailed breakdown of student performance.

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide React
*   **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
*   **Image Processing**: OpenCV.js, Sharp, Jimp
*   **AI Integration**: Google Gemini API
*   **PDF/Codes**: PDFKit, pdfjs-dist, jsBarcode, QRCode
*   **State Management**: Zustand

## 📂 Folder Structure

```bash
al-ghazali-omr/
├── app/                  # Next.js App Router pages
│   ├── (admin)/          # Admin dashboard routes
│   ├── (teacher)/        # Teacher dashboard routes
│   ├── (student)/        # Student dashboard routes
│   └── api/              # API endpoints (OMR upload, processing)
├── components/           # Reusable React components
├── lib/                  # Core logic
│   ├── supabase/         # Database clients
│   ├── omr-processor/    # OpenCV & Image processing logic
│   └── gemini-ai/        # AI fallback logic
├── public/               # Static assets
└── CONFIGURATION_MD/     # detailed project documentation
```

## 🔧 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/al-ghazali-omr.git
    cd al-ghazali-omr
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env.local` file with your credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open the app**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Documentation

For detailed documentation on specific modules, check the `CONFIGURATION_MD` folder:
*   [Project Overview](./CONFIGURATION_MD/GEMINI.md)
*   [OMR Processing Pipeline](./CONFIGURATION_MD/OMR_PROCESSING_GEMINI.md)
*   [Admin Guide](./CONFIGURATION_MD/ADMIN_GEMINI.md)
*   [Teacher Guide](./CONFIGURATION_MD/TEACHER_GEMINI.md)
*   [Student Guide](./CONFIGURATION_MD/STUDENT_GEMINI.md)

## 🤝 Contributing

Contributions are welcome! Please follow the workflow:
1.  Fork the repo.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

---

**Built with ❤️ for Education Revolution**
**Bismillah! Let's transform education! 🇵🇰**
