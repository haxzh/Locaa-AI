// /** @type {import('tailwindcss').Config} */
// export default {
//     content: [
//         "./index.html",
//         "./src/**/*.{js,ts,jsx,tsx}",
//     ],
//     theme: {
//         extend: {
//             colors: {
//                 primary: {
//                     50: '#f0fdfa',
//                     100: '#ccfbf1',
//                     200: '#99f6e4',
//                     300: '#5eead4',
//                     400: '#2dd4bf',
//                     500: '#14b8a6',
//                     600: '#0d9488',
//                     700: '#0f766e',
//                     800: '#115e59',
//                     900: '#134e4a',
//                     950: '#042f2e',
//                 },
//                 dark: {
//                     900: '#0B0F19', // very dark blue/black
//                     800: '#111827',
//                     700: '#1F2937',
//                     600: '#374151',
//                     500: '#4B5563',
//                     400: '#6B7280',
//                     50: '#F9FAFB'
//                 }
//             },
//             fontFamily: {
//                 sans: ['"Inter"', 'system-ui', 'sans-serif'],
//                 display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
//             },
//             animation: {
//                 'blob': 'blob 7s infinite',
//                 'fade-in': 'fadeIn 0.5s ease-out forwards',
//                 'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
//             },
//             keyframes: {
//                 blob: {
//                     '0%': { transform: 'translate(0px, 0px) scale(1)' },
//                     '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
//                     '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
//                     '100%': { transform: 'translate(0px, 0px) scale(1)' },
//                 },
//                 fadeIn: {
//                     from: { opacity: '0' },
//                     to: { opacity: '1' },
//                 },
//                 slideUp: {
//                     from: { opacity: '0', transform: 'translateY(20px)' },
//                     to: { opacity: '1', transform: 'translateY(0)' },
//                 }
//             }
//         },
//     },
//     plugins: [],
// }







/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],

    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#f0fdfa",
                    100: "#ccfbf1",
                    200: "#99f6e4",
                    300: "#5eead4",
                    400: "#2dd4bf",
                    500: "#14b8a6",
                    600: "#0d9488",
                    700: "#0f766e",
                    800: "#115e59",
                    900: "#134e4a",
                    950: "#042f2e",
                },

                dark: {
                    900: "#0B0F19",
                    800: "#111827",
                    700: "#1F2937",
                    600: "#374151",
                    500: "#4B5563",
                    400: "#6B7280",
                    50: "#F9FAFB",
                },
            },

            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Space Grotesk", "system-ui", "sans-serif"],
            },

            animation: {
                blob: "blob 7s infinite",
                "fade-in": "fadeIn 0.5s ease-out forwards",
                "slide-up": "slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
                "gradient-x": "gradientX 4s ease infinite",
                "float-particle": "floatParticle 8s ease-in-out infinite",
                "glow-pulse": "glowPulse 3s ease-in-out infinite",
                "progress-shimmer": "shimmer 1.5s ease infinite",
            },

            keyframes: {
                blob: {
                    "0%": { transform: "translate(0px,0px) scale(1)" },
                    "33%": { transform: "translate(30px,-50px) scale(1.1)" },
                    "66%": { transform: "translate(-20px,20px) scale(0.9)" },
                    "100%": { transform: "translate(0px,0px) scale(1)" },
                },
                fadeIn: {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                slideUp: {
                    from: { opacity: "0", transform: "translateY(20px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                gradientX: {
                    "0%, 100%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                },
                floatParticle: {
                    "0%, 100%": { transform: "translateY(0px) translateX(0px)", opacity: "0.6" },
                    "25%": { transform: "translateY(-20px) translateX(10px)", opacity: "1" },
                    "50%": { transform: "translateY(-40px) translateX(-5px)", opacity: "0.4" },
                    "75%": { transform: "translateY(-15px) translateX(-15px)", opacity: "0.8" },
                },
                glowPulse: {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(20,184,166,0.2)" },
                    "50%": { boxShadow: "0 0 40px rgba(20,184,166,0.5), 0 0 80px rgba(20,184,166,0.15)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "200% 0" },
                    "100%": { backgroundPosition: "-200% 0" },
                },
            },
        },
    },

    plugins: [],
};