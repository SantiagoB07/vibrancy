"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedSectionProps {
    children: React.ReactNode;
    className?: string;
    animation?: "fade-up" | "fade-left" | "fade-right" | "scale-in";
    delay?: number;
}

export function AnimatedSection({
    children,
    className = "",
    animation = "fade-up",
    delay = 0,
}: AnimatedSectionProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -50px 0px",
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    const animationClasses = {
        "fade-up": "animate-fade-in-up",
        "fade-left": "animate-fade-in-left",
        "fade-right": "animate-fade-in-right",
        "scale-in": "animate-scale-in",
    };

    return (
        <div
            ref={ref}
            className={`${className} ${isVisible ? animationClasses[animation] : "opacity-0"}`}
            style={{ animationDelay: `${delay}s` }}
        >
            {children}
        </div>
    );
}
