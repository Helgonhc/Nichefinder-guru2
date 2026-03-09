import { motion } from "framer-motion";

export const LoginBackground = () => {
    return (
        <div className="fixed inset-0 z-0 bg-[#020202] overflow-hidden pointer-events-none">
            {/* 1. Base Layer: Deep Grain Texture */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay grain-texture" />

            {/* 2. Layered Radial Gradients (Subtle Glows) */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/2 rounded-full blur-[100px]" />

            {/* 3. Technical Grid (Faint & Precise) */}
            <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(223, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(223, 255, 0, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* 4. Center Spotlight (behind the card) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(223,255,0,0.02)_0%,transparent_70%)]" />

            {/* 5. Minimal Animated Particles (Very subtle) */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-px h-px bg-primary/20 rounded-full"
                        initial={{
                            x: Math.random() * 100 + "%",
                            y: Math.random() * 100 + "%",
                            opacity: 0
                        }}
                        animate={{
                            y: [null, "-10%"],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 10
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
