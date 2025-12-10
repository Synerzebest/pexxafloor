"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Carousel } from "antd";
import type { CarouselRef } from "antd/es/carousel";

interface Props {
  images: string[];
  alt: string;
}

export default function ProductGallery({ images, alt }: Props) {
  const [current, setCurrent] = useState(0);
  const carouselRef = useRef<CarouselRef>(null);

  return (
    <div>
      {/* Image principale avec Carousel */}
      <Carousel
        ref={carouselRef}
        afterChange={(i) => setCurrent(i)}
        dots={false}
        className="rounded-lg shadow mx-auto max-w-md"
      >
        {images.map((url, idx) => (
          <div key={idx} className="w-full aspect-square relative">
            <Image
              src={url}
              alt={`${alt} ${idx + 1}`}
              fill
              className="object-contain rounded-lg"
            />
          </div>
        ))}
      </Carousel>

      {/* Miniatures cliquables */}
      <div className="flex gap-3 mt-4 overflow-x-auto">
        {images.map((url, idx) => (
          <div
            key={idx}
            className={`w-20 h-20 relative flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition ${
              idx === current ? "border-orange-500" : "border-transparent"
            }`}
            onClick={() => {
              setCurrent(idx);
              carouselRef.current?.goTo(idx);
            }}
          >
            <Image
              src={url}
              alt={`${alt} - ${idx + 1}`}
              fill
              className="object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
