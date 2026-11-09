CREATE TABLE books (
  id VARCHAR(80) PRIMARY KEY, title VARCHAR(200) NOT NULL, author VARCHAR(150) NOT NULL, genre VARCHAR(60) NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0), mrp NUMERIC(10,2) NOT NULL CHECK (mrp >= price),
  rating NUMERIC(2,1) NOT NULL CHECK (rating BETWEEN 0 AND 5), pub_year INT NOT NULL, blurb TEXT NOT NULL,
  hue INT NOT NULL DEFAULT 0, stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_books_price ON books(price);
