-- DEMO DATA (public-domain titles, invented prices and stock). Repeatable: safe to re-run.
INSERT INTO books(id,title,author,genre,price,mrp,rating,pub_year,blurb,hue,stock) VALUES
('pride-and-prejudice','Pride and Prejudice','Jane Austen','Classics',299,399,4.6,1813,'Elizabeth Bennet and Mr Darcy navigate pride, class and first impressions.',340,25),
('jane-eyre','Jane Eyre','Charlotte Brontë','Classics',349,449,4.5,1847,'An orphaned governess finds love and independence at Thornfield Hall.',200,18),
('wuthering-heights','Wuthering Heights','Emily Brontë','Classics',279,379,4.2,1847,'A turbulent tale of obsession on the Yorkshire moors.',20,12),
('sherlock-holmes','The Adventures of Sherlock Holmes','Arthur Conan Doyle','Mystery',329,429,4.7,1892,'Twelve cases from the world’s most famous consulting detective.',30,30),
('dracula','Dracula','Bram Stoker','Horror',319,419,4.4,1897,'Count Dracula’s arrival in England, told through letters and diaries.',350,10),
('frankenstein','Frankenstein','Mary Shelley','Science Fiction',289,389,4.3,1818,'A scientist’s ambition creates a being he cannot control.',150,14),
('crime-and-punishment','Crime and Punishment','Fyodor Dostoevsky','Classics',399,499,4.6,1866,'A student’s crime and the conscience that unravels him.',260,9),
('dorian-gray','The Picture of Dorian Gray','Oscar Wilde','Classics',249,349,4.4,1890,'A portrait ages while its subject stays young.',45,20),
('meditations','Meditations','Marcus Aurelius','Philosophy',269,369,4.7,180,'Private reflections of a Roman emperor on discipline and calm.',100,22),
('art-of-war','The Art of War','Sun Tzu','Philosophy',199,299,4.3,-500,'Ancient strategy on conflict, preparation and restraint.',180,16),
('alice','Alice’s Adventures in Wonderland','Lewis Carroll','Children',229,329,4.5,1865,'Alice follows a white rabbit into a nonsensical underground world.',210,19),
('hound-baskervilles','The Hound of the Baskervilles','Arthur Conan Doyle','Mystery',299,399,4.6,1902,'Holmes and Watson investigate a spectral hound on Dartmoor.',60,15)
ON CONFLICT (id) DO NOTHING;
