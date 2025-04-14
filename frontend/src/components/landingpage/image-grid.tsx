"use client";

import Image from "next/image";

export default function ImageGrid() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-5 grid-rows-2 gap-6 h-[450px]">
          {/* Large image on the left - spans 3 columns and full height */}
          <div className="col-span-3 row-span-2 relative overflow-hidden rounded-xl shadow-lg h-full">
            <Image
              src="/amazon1.jpg"
              alt="Aerial view of road through forest"
              fill
              className="object-cover object-center"
            />
          </div>

          {/* Top right image - spans 2 columns */}
          <div className="col-span-2 row-span-1 relative overflow-hidden rounded-xl shadow-lg h-full">
            <Image
              src="/amazon1.jpg"
              alt="Aerial view of house in forest"
              fill
              className="object-cover object-center"
            />
          </div>

          {/* Bottom left small image */}
          <div className="col-span-1 row-span-1 relative overflow-hidden rounded-xl shadow-lg h-full">
            <Image
              src="/amazon1.jpg"
              alt="Misty forest"
              fill
              className="object-cover object-center"
            />
          </div>

          <div className="col-span-1 row-span-1 relative overflow-hidden rounded-xl shadow-lg h-full">
            <Image
              src="/amazon1.jpg"
              alt="Aerial forest canopy"
              fill
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
