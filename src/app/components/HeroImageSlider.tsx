import React from 'react';
import Slider from 'react-slick'; // Import react-slick
import { CldImage } from 'next-cloudinary';

// Interface for HeroImage
interface HeroImage {
  id: number;
  imageUrl: string;
  label: string;
  buttonText: string;
  buttonLink: string;
}

interface HeroImageSliderProps {
  heroImages: HeroImage[];
}

const HeroImageSlider: React.FC<HeroImageSliderProps> = ({ heroImages }) => {
  // Settings for react-slick slider
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div>
      {heroImages.length > 1 ? (
        <Slider {...settings}>
          {heroImages.map((image) => (
            <div key={image.id} className="relative">
              <div className="relative h-[60vh] md:h-[80vh] lg:h-[100vh] w-full overflow-hidden"> {/* ทำให้ responsive */} 
                {/* แสดงภาพที่อัปโหลด */}
                <CldImage
                  src={image.imageUrl}
                  alt={image.label}
                  fill
                  style={{ objectFit: 'cover' }} // ใช้ objectFit: 'cover' เพื่อให้ภาพแสดงเต็มขนาด
                />
              </div>

              {/* แสดงชื่อแคมเปญและปุ่ม */}
              <div className="absolute bottom-4 left-4 p-4 md:bottom-8 md:left-8 rounded-lg">
                <div className="bg-white p-4 md:p-6">
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold">{image.label}</h1>
                  <p className="text-lg md:text-xl lg:text-2xl text-center">{image.buttonText}</p>
                </div>
                <a
  href={image.buttonLink}
  className="inline-block text-lg md:text-xl mt-2 bg-white bg-opacity-20 text-white border-4 border-white px-4 py-2 transition-transform duration-300 transform hover:scale-105"
>
  Buy Now
</a>
              </div>
            </div>
          ))}
        </Slider>
      ) : (
        heroImages.map((image) => (
          <div key={image.id} className="relative">
            <div className="relative h-[60vh] md:h-[80vh] lg:h-[90vh] w-full overflow-hidden shadow-lg"> {/* ทำให้ responsive */}
              {/* แสดงภาพที่อัปโหลด */}
              <CldImage
                src={image.imageUrl}
                alt={image.label}
                fill
                style={{ objectFit: 'cover' }} // ใช้ objectFit: 'cover' เพื่อให้ภาพแสดงเต็มขนาด
              />
            </div>

            {/* แสดงชื่อแคมเปญและปุ่ม */}
            <div className="absolute bottom-4 left-4 p-4 md:bottom-8 md:left-8 rounded-lg">
              <div className="bg-white p-4 md:p-6">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold">{image.label}</h1>
                <p className="text-lg md:text-xl lg:text-2xl text-center">{image.buttonText}</p>
              </div>
              <a
                href={image.buttonLink}
                className="inline-block text-lg md:text-xl mt-2 bg-white bg-opacity-20 text-white border-4 border-white px-4 py-2"
              >
                Buy Now
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default HeroImageSlider;
