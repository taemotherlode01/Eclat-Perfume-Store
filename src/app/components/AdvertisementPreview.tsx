import React from 'react';
import Slider from "react-slick";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface Advertisement {
  id: number;
  description: string; // For rich text description (HTML content)
}

interface AdvertisementPreviewProps {
  ads: Advertisement[]; // Accepting list of advertisements as props
}

// Component to display advertisements in a slider
const AdvertisementPreview: React.FC<AdvertisementPreviewProps> = ({ ads }) => {
  const settings = {
    dots: false, // Remove the dots
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: ads.length > 1, // Autoplay only if there are more than 1 ad
    autoplaySpeed: 3000,
    arrows: false,
  };

  if (ads.length === 0) {
    return (
      <div className="bg-gray-100 p-6" style={{ minHeight: '60px' }}>
        <p className="text-center">No advertisements available.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-6 " style={{ minHeight: '40px' }}>
      {ads.length > 1 ? (
        <Slider {...settings}>
          {ads.map((ad) => (
            <div key={ad.id}>
              <div
                className="text-center text-lg"
               
                dangerouslySetInnerHTML={{ __html: ad.description }} // Render HTML content
              />
            </div>
          ))}
        </Slider>
      ) : (
        <div
          className="text-center text-lg"
          dangerouslySetInnerHTML={{ __html: ads[0].description }} // Render single ad content
        />
      )}
    </div>
  );
};

export default AdvertisementPreview;
