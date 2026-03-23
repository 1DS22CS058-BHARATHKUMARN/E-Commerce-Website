import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Carousel } from "bootstrap";

import image1 from "../Images/image1.png";
import image2 from "../Images/image2.png";
import image3 from "../Images/image3.png";
import image4 from "../Images/image4.png";



export default function HomePage() {
  const token = localStorage.getItem("token");
  const carouselRef = useRef(null);

  useEffect(() => {
    if (carouselRef.current) {
      const carousel = new Carousel(carouselRef.current, {
        interval: 2000,
        ride: "carousel",
        pause: false,
        wrap: true,
      });

      return () => carousel.dispose();
    }
  }, []);

  return (
    <div className="container py-4">
      <div className="p-4 p-md-5 hero card-shadow mb-4 rounded-4 shadow-sm text-center">
        <h1 className="display-5 fw-bold mb-3">Welcome to Ecommerce</h1>
        <p className="mb-4" style={{ opacity: 0.95 }}>
          Browse products by category, search, view details, and checkout.
        </p>

        <div className="d-flex gap-2 flex-wrap justify-content-center">
          <Link to="/products" className="btn btn-light btn-lg">
            Shop now
          </Link>

          {!token ? (
            <Link to="/login" className="btn btn-outline-light btn-lg">
              Login
            </Link>
          ) : (
            <Link to="/my-orders" className="btn btn-outline-light btn-lg">
              My Orders
            </Link>
          )}
        </div>
      </div>

      <div
        id="homeCarousel"
        ref={carouselRef}
        className="carousel slide mb-4 rounded-4 overflow-hidden shadow"
      >
        <div className="carousel-indicators">
          <button
            type="button"
            data-bs-target="#homeCarousel"
            data-bs-slide-to="0"
            className="active"
            aria-current="true"
            aria-label="Slide 1"
          />
          <button
            type="button"
            data-bs-target="#homeCarousel"
            data-bs-slide-to="1"
            aria-label="Slide 2"
          />
          <button
            type="button"
            data-bs-target="#homeCarousel"
            data-bs-slide-to="2"
            aria-label="Slide 3"
          />
          <button
            type="button"
            data-bs-target="#homeCarousel"
            data-bs-slide-to="3"
            aria-label="Slide 4"
          />
        </div>

        <div className="carousel-inner">
          {[image1, image2, image3, image4].map((img, index) => (
            <div
              key={index}
              className={`carousel-item ${index === 0 ? "active" : ""}`}
            >
              <div
                style={{
                  height: "380px",
                  backgroundColor: "#f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                }}
              >
                <img
                  src={img}
                  alt={`Banner ${index + 1}`}
                  className="d-block w-100"
                  style={{
                    maxHeight: "100%",
                    objectFit: "contain",
                    borderRadius: "12px",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#homeCarousel"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>

        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#homeCarousel"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </div>
  );
}