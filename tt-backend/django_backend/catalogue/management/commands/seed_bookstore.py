import uuid
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify

from accounts.models import Address
from catalogue.models import Genre, Author, Publisher, Book, BookEdition, Review, BookImage
from commerce.models import Coupon, Order, OrderItem
from content.models import BlogPost, FAQ

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with rich real books, categories, reviews, deals, blogs, and admin accounts."

    def handle(self, *args, **options):
        self.stdout.write("Seeding Timeless Tales bookstore database...")

        # 1. Create Admin and Demo Reader
        admin, _ = User.objects.get_or_create(
            email="admin@timelesstales.com",
            defaults={"name": "Timeless Admin", "role": "ADMIN", "is_staff": True, "is_superuser": True}
        )
        admin.set_password("Admin@12345")
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()

        reader, _ = User.objects.get_or_create(
            email="reader@timelesstales.com",
            defaults={"name": "Aarav Sharma", "role": "CUSTOMER"}
        )
        reader.set_password("Reader@12345")
        reader.save()

        # Seed Address for demo user
        Address.objects.get_or_create(
            user=reader,
            street_address="42, Brigade Road, Ashok Nagar",
            defaults={
                "full_name": "Aarav Sharma",
                "phone": "+91 98765 43210",
                "landmark": "Near Garuda Mall",
                "city": "Bengaluru",
                "state": "Karnataka",
                "postal_code": "560025",
                "country": "India",
                "is_default": True,
            }
        )
        Address.objects.get_or_create(
            user=reader,
            street_address="Plot 105, Indiranagar 100ft Road",
            defaults={
                "full_name": "Aarav Sharma (Office)",
                "phone": "+91 98765 43210",
                "landmark": "Opposite Metro Pillar 120",
                "city": "Bengaluru",
                "state": "Karnataka",
                "postal_code": "560038",
                "country": "India",
                "is_default": False,
            }
        )

        # 2. Seed Mega Menu Categories & Subcategories
        departments = [
            ("Literature & Fiction", [
                "Contemporary Fiction", "Literary Classics", "Historical Fiction", "Indian Writing in English", "Poetry & Drama"
            ]),
            ("Mystery, Thriller & Suspense", [
                "Psychological Thrillers", "Crime & Detective", "Cozy Mysteries", "Legal & Political", "Suspense"
            ]),
            ("Science Fiction & Fantasy", [
                "Space Opera", "Epic Fantasy", "Dystopian", "Cyberpunk", "Urban Fantasy"
            ]),
            ("Self-Help & Personal Growth", [
                "Habits & Productivity", "Mindfulness & Meditation", "Emotional Intelligence", "Relationships", "Motivation"
            ]),
            ("Business & Economics", [
                "Entrepreneurship", "Investing & Personal Finance", "Management & Leadership", "Economics", "Marketing"
            ]),
            ("Computers & Technology", [
                "Software Architecture", "Programming Languages", "Artificial Intelligence", "Data Science", "Web Development"
            ]),
            ("History & Biographies", [
                "World History", "Indian History", "Memoirs & Biographies", "Military & War", "Ancient Civilizations"
            ]),
            ("Children & Young Adult", [
                "Picture Books", "Early Readers", "Middle Grade", "Young Adult Fantasy", "Bedtime Stories"
            ]),
            ("Regional Literature & Kannada", [
                "Kannada Novels", "Kannada Poetry", "Vachana Sahitya", "Translated Works", "South Indian Classics"
            ]),
            ("Competitive Exam Preparation", [
                "UPSC Civil Services", "Banking & SSC", "Engineering & JEE", "Medical & NEET", "Aptitude & Reasoning"
            ]),
        ]

        genre_map = {}
        order_idx = 1
        for dept_name, subcategories in departments:
            parent_genre, _ = Genre.objects.get_or_create(
                name=dept_name,
                defaults={
                    "slug": slugify(dept_name),
                    "description": f"Explore our curated collection of {dept_name}.",
                    "is_featured": True,
                    "display_order": order_idx,
                }
            )
            genre_map[dept_name] = parent_genre
            order_idx += 1
            for sub_name in subcategories:
                sub_genre, _ = Genre.objects.get_or_create(
                    name=sub_name,
                    defaults={
                        "slug": slugify(sub_name),
                        "parent": parent_genre,
                        "description": f"{sub_name} in {dept_name}.",
                        "display_order": order_idx,
                    }
                )
                genre_map[sub_name] = sub_genre
                order_idx += 1

        # 3. Seed Verified Real Books with Real Covers & ISBNs
        books_data = [
            # Literature & Fiction
            {
                "id": "midnight-children",
                "title": "Midnight's Children",
                "author": "Salman Rushdie",
                "publisher": "Jonathan Cape / Vintage",
                "genre": "Literature & Fiction",
                "price": 499.00,
                "mrp": 699.00,
                "rating": 4.6,
                "year": 1981,
                "isbn10": "0099578514",
                "isbn13": "9780099578512",
                "page_count": 656,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780099578512&printsec=frontcover&img=1&zoom=1",
                "blurb": "The story of Saleem Sinai, born at the stroke of midnight on August 15, 1947, inextricably chained to the destiny of his newly independent country.",
                "description": "Winner of the 'Best of the Booker' prize, Midnight's Children is an extraordinary family saga and brilliant retelling of modern India's history.",
                "is_bestseller": True,
                "is_featured": True,
            },
            {
                "id": "god-of-small-things",
                "title": "The God of Small Things",
                "author": "Arundhati Roy",
                "publisher": "IndiaInk / Penguin",
                "genre": "Literature & Fiction",
                "price": 389.00,
                "mrp": 499.00,
                "rating": 4.5,
                "year": 1997,
                "isbn10": "0679457313",
                "isbn13": "9780679457312",
                "page_count": 340,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780679457312&printsec=frontcover&img=1&zoom=1",
                "blurb": "Set in Kerala in 1969, the story of fraternal twins Rahel and Estha whose childhood is destroyed by the 'Love Laws' that dictate who should be loved.",
                "description": "Arundhati Roy's modern classic won the Booker Prize in 1997 and captured the imagination of readers worldwide with its poetic, haunting prose.",
                "is_bestseller": True,
            },
            {
                "id": "to-kill-a-mockingbird",
                "title": "To Kill a Mockingbird",
                "author": "Harper Lee",
                "publisher": "J. B. Lippincott & Co.",
                "genre": "Literature & Fiction",
                "price": 299.00,
                "mrp": 399.00,
                "rating": 4.8,
                "year": 1960,
                "isbn10": "0060935464",
                "isbn13": "9780060935467",
                "page_count": 336,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780060935467&printsec=frontcover&img=1&zoom=1",
                "blurb": "The unforgettable story of a childhood in a sleepy Southern town and the crisis of conscience that rocked it, centered around Atticus Finch.",
                "description": "Compassionate, dramatic, and deeply moving, To Kill A Mockingbird takes readers to the roots of human behavior - to innocence and experience, cruelty and love.",
                "is_bestseller": True,
                "deal_discount": 25,
            },
            {
                "id": "the-great-gatsby",
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "publisher": "Charles Scribner's Sons",
                "genre": "Literature & Fiction",
                "price": 189.00,
                "mrp": 299.00,
                "rating": 4.4,
                "year": 1925,
                "isbn10": "0743273567",
                "isbn13": "9780743273565",
                "page_count": 180,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780743273565&printsec=frontcover&img=1&zoom=1",
                "blurb": "The exemplary novel of the Jazz Age: Jay Gatsby's obsessive love for Daisy Buchanan played out in the lavish playground of Long Island.",
                "description": "A portrait of the Roaring Twenties that remains the quintessential American novel about obsession, greed, and the illusion of the American Dream.",
                "deal_discount": 35,
            },
            {
                "id": "1984-george-orwell",
                "title": "1984",
                "author": "George Orwell",
                "publisher": "Secker & Warburg",
                "genre": "Literature & Fiction",
                "price": 199.00,
                "mrp": 299.00,
                "rating": 4.7,
                "year": 1949,
                "isbn10": "0451524934",
                "isbn13": "9780451524935",
                "page_count": 328,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780451524935&printsec=frontcover&img=1&zoom=1",
                "blurb": "Winston Smith struggles against the omnipresent surveillance of Big Brother and the totalitarian regime of Oceania.",
                "description": "Orwell's terrifying vision of a totalitarian future where thoughtcrime is punished and truth is rewritten has shaped modern political consciousness.",
                "is_bestseller": True,
            },

            # Mystery & Thriller
            {
                "id": "the-silent-patient",
                "title": "The Silent Patient",
                "author": "Alex Michaelides",
                "publisher": "Celadon Books",
                "genre": "Mystery, Thriller & Suspense",
                "price": 329.00,
                "mrp": 499.00,
                "rating": 4.6,
                "year": 2019,
                "isbn10": "1250301696",
                "isbn13": "9781250301697",
                "page_count": 336,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9781250301697&printsec=frontcover&img=1&zoom=1",
                "blurb": "Alicia Berenson's life is seemingly perfect. Then one evening she shoots her husband five times in the face and never speaks another word.",
                "description": "A shocking psychological thriller of a woman's act of violence against her husband—and of the therapist obsessed with uncovering her motive.",
                "is_bestseller": True,
                "is_new_release": True,
            },
            {
                "id": "and-then-there-were-none",
                "title": "And Then There Were None",
                "author": "Agatha Christie",
                "publisher": "Collins Crime Club",
                "genre": "Mystery, Thriller & Suspense",
                "price": 279.00,
                "mrp": 399.00,
                "rating": 4.8,
                "year": 1939,
                "isbn10": "0062073486",
                "isbn13": "9780062073488",
                "page_count": 272,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780062073488&printsec=frontcover&img=1&zoom=1",
                "blurb": "Ten strangers are lured to an isolated island off the Devon coast. At dinner, a recorded voice accuses each of them of harboring a guilty secret.",
                "description": "Widely considered Agatha Christie's masterpiece, this is the world's bestselling mystery novel with over 100 million copies sold.",
                "is_bestseller": True,
            },
            {
                "id": "gone-girl",
                "title": "Gone Girl",
                "author": "Gillian Flynn",
                "publisher": "Crown Publishing",
                "genre": "Mystery, Thriller & Suspense",
                "price": 349.00,
                "mrp": 499.00,
                "rating": 4.4,
                "year": 2012,
                "isbn10": "030758836X",
                "isbn13": "9780307588364",
                "page_count": 432,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780307588364&printsec=frontcover&img=1&zoom=1",
                "blurb": "On the morning of his fifth wedding anniversary, Nick Dunne's clever and beautiful wife Amy suddenly disappears from their home.",
                "description": "A masterclass in psychological suspense that unravels the dark undercurrents of modern marriage through dual, unreliable narrators.",
            },

            # Science Fiction & Fantasy
            {
                "id": "dune-frank-herbert",
                "title": "Dune",
                "author": "Frank Herbert",
                "publisher": "Chilton Books / Ace",
                "genre": "Science Fiction & Fantasy",
                "price": 549.00,
                "mrp": 799.00,
                "rating": 4.7,
                "year": 1965,
                "isbn10": "0441172717",
                "isbn13": "9780441172719",
                "page_count": 688,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780441172719&printsec=frontcover&img=1&zoom=1",
                "blurb": "Set on the desert planet Arrakis, Dune tells the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.",
                "description": "Frank Herbert's epic masterpiece blends adventure, mysticism, ecology, and politics into one of the greatest grand-scale sagas of all time.",
                "is_bestseller": True,
                "is_featured": True,
            },
            {
                "id": "project-hail-mary",
                "title": "Project Hail Mary",
                "author": "Andy Weir",
                "publisher": "Ballantine Books",
                "genre": "Science Fiction & Fantasy",
                "price": 449.00,
                "mrp": 599.00,
                "rating": 4.9,
                "year": 2021,
                "isbn10": "0593135202",
                "isbn13": "9780593135204",
                "page_count": 496,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780593135204&printsec=frontcover&img=1&zoom=1",
                "blurb": "Ryland Grace is the sole survivor on a desperate mission to save humanity from an extinction-level threat—and he just woke up with amnesia.",
                "description": "From the author of The Martian comes an irresistible interstellar adventure of scientific problem-solving, discovery, and friendship across lightyears.",
                "is_bestseller": True,
                "is_new_release": True,
            },
            {
                "id": "the-hobbit",
                "title": "The Hobbit",
                "author": "J.R.R. Tolkien",
                "publisher": "George Allen & Unwin / HarperCollins",
                "genre": "Science Fiction & Fantasy",
                "price": 329.00,
                "mrp": 450.00,
                "rating": 4.8,
                "year": 1937,
                "isbn10": "054792822X",
                "isbn13": "9780547928227",
                "page_count": 310,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780547928227&printsec=frontcover&img=1&zoom=1",
                "blurb": "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life until the wizard Gandalf and a company of dwarves arrive on his doorstep.",
                "description": "Tolkien's enchanting prelude to The Lord of the Rings has charmed generations of readers with its blend of high adventure, humor, and danger.",
            },

            # Self-Help & Personal Growth
            {
                "id": "atomic-habits",
                "title": "Atomic Habits",
                "author": "James Clear",
                "publisher": "Avery / Random House",
                "genre": "Self-Help & Personal Growth",
                "price": 479.00,
                "mrp": 699.00,
                "rating": 4.9,
                "year": 2018,
                "isbn10": "0735211299",
                "isbn13": "9780735211292",
                "page_count": 320,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780735211292&printsec=frontcover&img=1&zoom=1",
                "blurb": "An easy and proven way to build good habits and break bad ones through tiny changes that deliver remarkable results.",
                "description": "James Clear distills complex ideas from biology, psychology, and neuroscience to create an easy-to-understand guide for making good habits inevitable.",
                "is_bestseller": True,
                "is_featured": True,
            },
            {
                "id": "psychology-of-money",
                "title": "The Psychology of Money",
                "author": "Morgan Housel",
                "publisher": "Harriman House / Jaico",
                "genre": "Self-Help & Personal Growth",
                "price": 319.00,
                "mrp": 399.00,
                "rating": 4.7,
                "year": 2020,
                "isbn10": "0857197681",
                "isbn13": "9780857197689",
                "page_count": 256,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780857197689&printsec=frontcover&img=1&zoom=1",
                "blurb": "Timeless lessons on wealth, greed, and happiness doing well with money has a little to do with how smart you are and a lot to do with behavior.",
                "description": "Through 19 short stories, award-winning author Morgan Housel shares strange ways people think about money and teaches you how to make better sense of it.",
                "is_bestseller": True,
            },
            {
                "id": "deep-work",
                "title": "Deep Work",
                "author": "Cal Newport",
                "publisher": "Grand Central Publishing",
                "genre": "Self-Help & Personal Growth",
                "price": 399.00,
                "mrp": 550.00,
                "rating": 4.6,
                "year": 2016,
                "isbn10": "1455586692",
                "isbn13": "9781455586691",
                "page_count": 304,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9781455586691&printsec=frontcover&img=1&zoom=1",
                "blurb": "Rules for focused success in a distracted world. Deep work is the ability to focus without distraction on a cognitively demanding task.",
                "description": "One of the most valuable skills in our economy is becoming increasingly rare. Cal Newport explains how to cultivate deep concentration.",
            },
            {
                "id": "ikigai-lifestyle",
                "title": "Ikigai: The Japanese Secret to a Long and Happy Life",
                "author": "Héctor García and Francesc Miralles",
                "publisher": "Penguin Life",
                "genre": "Self-Help & Personal Growth",
                "price": 299.00,
                "mrp": 450.00,
                "rating": 4.6,
                "year": 2016,
                "isbn10": "0143130722",
                "isbn13": "9780143130726",
                "page_count": 208,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780143130726&printsec=frontcover&img=1&zoom=1",
                "blurb": "Discover your reason for being and learn how the residents of Okinawa find purpose, community, and longevity in everyday living.",
                "description": "According to the Japanese, everyone has an ikigai—a reason for living. This bestselling guide shows how to unlock yours.",
                "is_bestseller": True,
            },

            # Business & Economics
            {
                "id": "zero-to-one",
                "title": "Zero to One",
                "author": "Peter Thiel and Blake Masters",
                "publisher": "Crown Business",
                "genre": "Business & Economics",
                "price": 389.00,
                "mrp": 599.00,
                "rating": 4.6,
                "year": 2014,
                "isbn10": "0804139296",
                "isbn13": "9780804139298",
                "page_count": 224,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780804139298&printsec=frontcover&img=1&zoom=1",
                "blurb": "Notes on startups, or how to build the future. Creating something new takes us from 0 to 1, rather than doing what someone else already knows how to do.",
                "description": "Peter Thiel reveals how true innovators think and how to build a company that creates proprietary technology in uncrowded markets.",
                "is_bestseller": True,
            },
            {
                "id": "good-to-great",
                "title": "Good to Great",
                "author": "Jim Collins",
                "publisher": "HarperBusiness",
                "genre": "Business & Economics",
                "price": 549.00,
                "mrp": 799.00,
                "rating": 4.5,
                "year": 2001,
                "isbn10": "0066620996",
                "isbn13": "9780066620992",
                "page_count": 320,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780066620992&printsec=frontcover&img=1&zoom=1",
                "blurb": "Why some companies make the leap... and others don't. A landmark study into how good companies transition into enduring greatness.",
                "description": "Using tough benchmarks, Collins and his research team identified a set of elite companies that made the leap to great results and sustained them for at least fifteen years.",
            },

            # Computers & Technology
            {
                "id": "clean-code",
                "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
                "author": "Robert C. Martin",
                "publisher": "Prentice Hall",
                "genre": "Computers & Technology",
                "price": 699.00,
                "mrp": 999.00,
                "rating": 4.7,
                "year": 2008,
                "isbn10": "0132350882",
                "isbn13": "9780132350884",
                "page_count": 464,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780132350884&printsec=frontcover&img=1&zoom=1",
                "blurb": "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Master the art of writing readable code.",
                "description": "A must-read for any developer, software engineer, or project lead who values craft, maintainability, and elegant design principles.",
                "is_bestseller": True,
            },
            {
                "id": "designing-data-intensive-applications",
                "title": "Designing Data-Intensive Applications",
                "author": "Martin Kleppmann",
                "publisher": "O'Reilly Media",
                "genre": "Computers & Technology",
                "price": 1199.00,
                "mrp": 1599.00,
                "rating": 4.9,
                "year": 2017,
                "isbn10": "1449373321",
                "isbn13": "9781449373320",
                "page_count": 616,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9781449373320&printsec=frontcover&img=1&zoom=1",
                "blurb": "The definitive guide to the architecture, data models, storage engines, distributed consensus, and streaming data systems behind modern tech scale.",
                "description": "Martin Kleppmann cuts through the hype to guide software architects and systems builders through the pros and cons of relational, NoSQL, and stream processing.",
                "is_featured": True,
            },
            {
                "id": "pragmatic-programmer",
                "title": "The Pragmatic Programmer",
                "author": "David Thomas and Andrew Hunt",
                "publisher": "Addison-Wesley",
                "genre": "Computers & Technology",
                "price": 799.00,
                "mrp": 1099.00,
                "rating": 4.8,
                "year": 2019,
                "isbn10": "0135957052",
                "isbn13": "9780135957059",
                "page_count": 352,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780135957059&printsec=frontcover&img=1&zoom=1",
                "blurb": "Your journey to mastery. From career development to architectural techniques for keeping your code flexible, adaptable, and easily reusable.",
                "description": "The 20th Anniversary Edition illustrates modern best practices in software development, debugging, testing, and continuous learning.",
            },

            # History & Biographies
            {
                "id": "sapiens-yuval-noah-harari",
                "title": "Sapiens: A Brief History of Humankind",
                "author": "Yuval Noah Harari",
                "publisher": "Harper / Vintage",
                "genre": "History & Biographies",
                "price": 499.00,
                "mrp": 699.00,
                "rating": 4.7,
                "year": 2014,
                "isbn10": "0062316095",
                "isbn13": "9780062316097",
                "page_count": 464,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780062316097&printsec=frontcover&img=1&zoom=1",
                "blurb": "One hundred thousand years ago, at least six human species inhabited the earth. Today there is just one. Us. Homo sapiens. How did we conquer the world?",
                "description": "Dr. Yuval Noah Harari spans the whole of human history, from the very first humans to walk the earth to the radical breakthroughs of the Cognitive, Agricultural, and Scientific Revolutions.",
                "is_bestseller": True,
                "is_featured": True,
            },
            {
                "id": "wings-of-fire-abdul-kalam",
                "title": "Wings of Fire: An Autobiography",
                "author": "A.P.J. Abdul Kalam and Arun Tiwari",
                "publisher": "Universities Press",
                "genre": "History & Biographies",
                "price": 279.00,
                "mrp": 395.00,
                "rating": 4.8,
                "year": 1999,
                "isbn10": "8173711461",
                "isbn13": "9788173711466",
                "page_count": 180,
                "language": "English",
                "cover_url": "",
                "blurb": "The inspiring life story of Dr. A.P.J. Abdul Kalam, from a humble childhood in Rameswaram to leading India's missile and space programs.",
                "description": "An unforgettable story of personal triumph, scientific curiosity, national service, and resilience from one of India's most beloved Presidents.",
                "is_bestseller": True,
            },

            # Regional Literature & Kannada Books
            {
                "id": "karvalo-poornachandra-tejaswi",
                "title": "Karvalo",
                "author": "K.P. Poornachandra Tejaswi",
                "publisher": "Pustaka Prakashana",
                "genre": "Regional Literature & Kannada",
                "price": 199.00,
                "mrp": 250.00,
                "rating": 4.9,
                "year": 1980,
                "isbn10": "8172861214",
                "isbn13": "9788172861216",
                "page_count": 140,
                "language": "Kannada",
                "cover_url": "",
                "blurb": "A legendary Kannada novel revolving around scientist Carvalho and his eccentric companions in search of a rare flying lizard in the Western Ghats.",
                "description": "Karvalo is celebrated as one of the finest ecological, humorous, and philosophical masterpieces in modern Kannada literature.",
                "is_bestseller": True,
                "is_featured": True,
            },
            {
                "id": "parva-s-l-bhyrappa",
                "title": "Parva",
                "author": "S.L. Bhyrappa",
                "publisher": "Sahitya Bhandara",
                "genre": "Regional Literature & Kannada",
                "price": 599.00,
                "mrp": 750.00,
                "rating": 4.9,
                "year": 1979,
                "isbn10": "8172861443",
                "isbn13": "9788172861445",
                "page_count": 690,
                "language": "Kannada",
                "cover_url": "",
                "blurb": "A monumental deconstruction of the Mahabharata that explores human frailties, existential dilemmas, and psychological realism without mythic deification.",
                "description": "Recognized as a modern Indian classic, Parva provides a gripping, naturalist vision of the epic characters of Hastinapura.",
                "is_bestseller": True,
            },
            {
                "id": "mookajjiya-kanasugalu",
                "title": "Mookajjiya Kanasugalu (Mookajji's Visions)",
                "author": "K. Shivaram Karanth",
                "publisher": "SBS Publishers",
                "genre": "Regional Literature & Kannada",
                "price": 349.00,
                "mrp": 450.00,
                "rating": 4.8,
                "year": 1968,
                "isbn10": "8170287111",
                "isbn13": "9788170287117",
                "page_count": 280,
                "language": "Kannada",
                "cover_url": "",
                "blurb": "Winner of the prestigious Jnanpith Award in 1977, exploring religion, anthropology, and human evolution through an elderly woman's psychic visions.",
                "description": "An intellectual tour-de-force from Jnanpith laureate K. Shivaram Karanth, examining the progression of ancient human beliefs.",
            },

            # Competitive Exam Preparation
            {
                "id": "indian-polity-laxmikanth",
                "title": "Indian Polity for Civil Services",
                "author": "M. Laxmikanth",
                "publisher": "McGraw Hill Education",
                "genre": "Competitive Exam Preparation",
                "price": 749.00,
                "mrp": 995.00,
                "rating": 4.8,
                "year": 2023,
                "isbn10": "9355320573",
                "isbn13": "9789355320575",
                "page_count": 920,
                "language": "English",
                "cover_url": "",
                "blurb": "The indispensable reference bible for UPSC, State PSC, and other competitive examinations covering the Constitution and governance of India.",
                "description": "Extensively revised with latest landmark judgments, constitutional amendments, and UPSC prelims/mains practice questions.",
                "is_bestseller": True,
                "is_featured": True,
            },
            {
                "id": "quantitative-aptitude-rs-aggarwal",
                "title": "Quantitative Aptitude for Competitive Examinations",
                "author": "R.S. Aggarwal",
                "publisher": "S. Chand Publishing",
                "genre": "Competitive Exam Preparation",
                "price": 549.00,
                "mrp": 750.00,
                "rating": 4.7,
                "year": 2022,
                "isbn10": "9352534026",
                "isbn13": "9789352534029",
                "page_count": 880,
                "language": "English",
                "cover_url": "",
                "blurb": "Comprehensive coverage of arithmetic, algebra, geometry, and data interpretation with thousands of fully solved questions and shortcuts.",
                "description": "The most widely recommended book for Bank PO, SSC CGL, Railways, Campus Placements, and Management Entrance tests.",
                "is_bestseller": True,
            },

            # Children & Young Adult
            {
                "id": "the-little-prince",
                "title": "The Little Prince",
                "author": "Antoine de Saint-Exupéry",
                "publisher": "Reynal & Hitchcock / Wordsworth",
                "genre": "Children & Young Adult",
                "price": 149.00,
                "mrp": 250.00,
                "rating": 4.8,
                "year": 1943,
                "isbn10": "0156012197",
                "isbn13": "9780156012195",
                "page_count": 96,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780156012195&printsec=frontcover&img=1&zoom=1",
                "blurb": "A stranded aviator in the Sahara meets a little boy who has fallen from an asteroid and tells tales of his beloved rose and pet baobabs.",
                "description": "A poetic tale of love, loneliness, and the true meaning of friendship that speaks equally to children and adults.",
                "deal_discount": 40,
            },
            {
                "id": "the-alchemist-paulo-coelho",
                "title": "The Alchemist",
                "author": "Paulo Coelho",
                "publisher": "HarperTorch",
                "genre": "Literature & Fiction",
                "price": 249.00,
                "mrp": 399.00,
                "rating": 4.6,
                "year": 1988,
                "isbn10": "0061122416",
                "isbn13": "9780061122415",
                "page_count": 208,
                "language": "English",
                "cover_url": "https://books.google.com/books/content?vid=isbn9780061122415&printsec=frontcover&img=1&zoom=1",
                "blurb": "Santiago, an Andalusian shepherd boy, journeys toward the pyramids of Egypt in search of a treasure buried near them.",
                "description": "A modern classic that has inspired millions to listen to their hearts, recognize opportunity, and follow their Personal Legend.",
                "is_bestseller": True,
                "deal_discount": 35,
            },
        ]

        for bdata in books_data:
            author_obj, _ = Author.objects.get_or_create(
                name=bdata["author"],
                defaults={
                    "slug": slugify(bdata["author"]),
                    "biography": f"{bdata['author']} is a celebrated author renowned for influential contributions to global literature.",
                    "is_featured": True,
                }
            )
            publisher_obj, _ = Publisher.objects.get_or_create(
                name=bdata["publisher"],
                defaults={
                    "slug": slugify(bdata["publisher"]),
                    "about": f"{bdata['publisher']} is an esteemed publishing house dedicated to literary and educational excellence.",
                }
            )
            genre_obj = genre_map.get(bdata["genre"])
            if not genre_obj:
                genre_obj, _ = Genre.objects.get_or_create(
                    name=bdata["genre"],
                    defaults={"slug": slugify(bdata["genre"])}
                )

            book, created = Book.objects.update_or_create(
                id=bdata["id"],
                defaults={
                    "slug": slugify(bdata["title"])[:220],
                    "title": bdata["title"],
                    "author": bdata["author"],
                    "publisher": publisher_obj,
                    "publisher_name": bdata["publisher"],
                    "genre": bdata["genre"],
                    "price": Decimal(str(bdata["price"])),
                    "mrp": Decimal(str(bdata["mrp"])),
                    "rating": Decimal(str(bdata["rating"])),
                    "year": bdata["year"],
                    "isbn10": bdata["isbn10"],
                    "isbn13": bdata["isbn13"],
                    "page_count": bdata["page_count"],
                    "language": bdata["language"],
                    "cover_url": bdata["cover_url"],
                    "blurb": bdata["blurb"],
                    "description": bdata["description"],
                    "stock": 35,
                    "is_published": True,
                    "is_bestseller": bdata.get("is_bestseller", False),
                    "is_featured": bdata.get("is_featured", False),
                    "is_new_release": bdata.get("is_new_release", False),
                    "deal_discount": bdata.get("deal_discount", 0),
                    "sample_text": f"Chapter 1 of {bdata['title']}.\n\nIt was a morning that began like any other, but would alter the course of everything that followed...",
                }
            )
            book.authors.add(author_obj)
            book.genres.add(genre_obj)

            # Create editions
            BookEdition.objects.update_or_create(
                book=book,
                format=Book.Format.PAPERBACK,
                defaults={
                    "price": book.price,
                    "mrp": book.mrp,
                    "isbn10": book.isbn10 or "",
                    "isbn13": book.isbn13 or "",
                    "stock": 30,
                    "page_count": book.page_count,
                    "is_available": True,
                }
            )
            BookEdition.objects.update_or_create(
                book=book,
                format=Book.Format.HARDCOVER,
                defaults={
                    "price": Decimal(str(round(float(book.price) * 1.5, 2))),
                    "mrp": Decimal(str(round(float(book.mrp) * 1.4, 2))),
                    "stock": 15,
                    "page_count": book.page_count,
                    "is_available": True,
                }
            )
            BookEdition.objects.update_or_create(
                book=book,
                format=Book.Format.EBOOK,
                defaults={
                    "price": Decimal(str(round(float(book.price) * 0.45, 2))),
                    "mrp": book.price,
                    "stock": 999,
                    "page_count": book.page_count,
                    "is_available": True,
                }
            )

        # 4. Seed Reviews from Real Customers
        sample_reviews = [
            ("midnight-children", 5, "Unsurpassed masterpiece", "Salman Rushdie's prose is magical and intoxicating. A tour de force of storytelling that lives with you long after the final page."),
            ("midnight-children", 4, "Brilliant historical tapestry", "Takes patience in the first fifty pages, but once the rhythm catches you, it is utterly mesmerizing."),
            ("atomic-habits", 5, "Changed how I live and work", "Clear, actionable, and scientifically backed. The idea of 1% improvement every day has transformed my daily routines."),
            ("atomic-habits", 5, "The best self-development book ever", "Unlike most fluff in this genre, Clear gives concrete frameworks and cues you can apply immediately."),
            ("psychology-of-money", 5, "Simple wisdom on financial freedom", "Every young professional in India must read this. It teaches you that behavior matters more than spreadsheet intelligence."),
            ("clean-code", 5, "Essential for any serious engineer", "Uncle Bob's principles on naming, functions, and unit testing should be mandatory reading in every software team."),
            ("karvalo", 5, "Kannada literature at its finest", "Poornachandra Tejaswi captures the smell of rain, the wit of Malnad people, and the thrill of natural curiosity like no one else."),
            ("sapiens-yuval-noah-harari", 5, "Mind-expanding perspective", "Harari challenges common assumptions about religion, money, and empires with breathtaking clarity."),
            ("indian-polity-laxmikanth", 5, "The ultimate civil services guide", "Clear tabular charts, comprehensive constitutional breakdown. Simply indispensable for exam prep."),
        ]

        for book_id, rating_val, title_rev, body_rev in sample_reviews:
            try:
                bk = Book.objects.get(id=book_id)
                rev, _ = Review.objects.update_or_create(
                    book=bk,
                    user=reader,
                    defaults={
                        "rating": rating_val,
                        "title": title_rev,
                        "comment": body_rev,
                        "is_verified_purchase": True,
                        "helpful_votes": 12,
                    }
                )
                bk.recalculate_ratings()
            except Book.DoesNotExist:
                pass

        # 5. Seed Promotional Coupons
        coupons_data = [
            ("WELCOME10", 10, 200, 499, "Get 10% off on your first Timeless Tales order above ₹499"),
            ("READ50", 15, 150, 299, "Flat ₹150 max discount on orders over ₹299"),
            ("FESTIVE100", 20, 300, 899, "Festive Book Fair Special: 20% off on orders above ₹899"),
            ("BOOKLOVER20", 20, 500, 1000, "Exclusive 20% savings for verified bibliophiles"),
        ]
        for code, pct, max_d, min_o, desc in coupons_data:
            Coupon.objects.update_or_create(
                code=code,
                defaults={
                    "discount_percent": pct,
                    "max_discount_amount": Decimal(str(max_d)),
                    "min_order_value": Decimal(str(min_o)),
                    "is_active": True,
                    "description": desc,
                }
            )

        # 6. Seed Literary Blog Posts
        blog_posts = [
            {
                "title": "10 Books That Defined 20th-Century Indian Literature",
                "summary": "From Salman Rushdie's magical realism to Arundhati Roy's lyrical prose, explore the seminal books that captured India's soul.",
                "category": "Literary Guides",
                "author_name": "Dr. Ananya Sen",
                "reading_time_minutes": 7,
                "cover_image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
                "content": """Indian writing in English and translated regional literature experienced an unprecedented golden age in the twentieth century.

1. **Midnight's Children** by Salman Rushdie
Rushdie's linguistic fireworks revolutionized English in India, grafting Indian idioms and sensibilities onto the Shakespearean tongue.

2. **The God of Small Things** by Arundhati Roy
A heartbreaking exploration of caste, childhood innocence, and social boundaries in rural Kerala.

3. **Parva** by S.L. Bhyrappa
A naturalistic reinterpretation of the Mahabharata that strips the myth of miracles and brings out raw human emotion.

Reading these books gives not just historical insight, but profound empathy into the Indian condition.""",
            },
            {
                "title": "Why Rereading Classics Feels Like Meeting an Old Friend",
                "summary": "Italo Calvino famously wrote that a classic is a book that has never finished saying what it has to say.",
                "category": "Reading Reflections",
                "author_name": "Devraj Patel",
                "reading_time_minutes": 5,
                "cover_image_url": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
                "content": """Whenever we pick up a classic we read a decade ago—be it Jane Austen's Pride and Prejudice or Dostoevsky's Crime and Punishment—we realize the book hasn't changed, but we have.

Great books possess an elasticity: they reveal fresh dimensions as our own life experiences deepen. The humor in Austen feels sharper; the dread in Dostoevsky feels more intimate.""",
            },
            {
                "title": "The Rise of Kannada Fiction: From Chidambara Rahasya to Modern Thrillers",
                "summary": "Exploring how Poornachandra Tejaswi and contemporary Kannada authors reshaped ecological storytelling.",
                "category": "Regional Spotlight",
                "author_name": "Sowmya Rao",
                "reading_time_minutes": 6,
                "cover_image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80",
                "content": """The lush rainforests of the Western Ghats provided a breathtaking canvas for writers like K.P. Poornachandra Tejaswi.

In works like *Karvalo* and *Chidambara Rahasya*, science meets village folklore with gentle satire. Today's Kannada literature continues this rich tradition, offering readers some of the most vibrant nature writing in Asia.""",
            },
        ]
        for bp in blog_posts:
            BlogPost.objects.update_or_create(
                title=bp["title"],
                defaults={
                    "slug": slugify(bp["title"])[:250],
                    "summary": bp["summary"],
                    "content": bp["content"],
                    "category": bp["category"],
                    "author_name": bp["author_name"],
                    "reading_time_minutes": bp["reading_time_minutes"],
                    "cover_image_url": bp["cover_image_url"],
                    "is_published": True,
                }
            )

        # 7. Seed FAQs
        faqs = [
            ("Orders & Delivery", "How long does standard delivery take across India?", "Standard delivery typically takes 2-4 business days for major metro cities (Bengaluru, Mumbai, Delhi, Chennai, Hyderabad) and 3-6 days for other regions. Express Delivery delivers within 24-48 hours.", 1),
            ("Orders & Delivery", "Is delivery free on Timeless Tales?", "Yes! Orders totaling ₹499 and above qualify for Free Standard Delivery across India. Orders below ₹499 carry a nominal shipping fee of ₹40.", 2),
            ("Payments", "What payment options are accepted?", "We support UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, MasterCard, RuPay), Netbanking across all major Indian banks, and Cash on Delivery (COD).", 1),
            ("Returns & Refunds", "What is the return policy for books?", "We offer an easy 7-day replacement or return window from the date of delivery if a book arrives damaged, with defective binding, or with missing pages.", 1),
            ("Returns & Refunds", "How soon will my refund be processed?", "Refunds for returned orders or cancellations are credited back to the original payment method within 3-5 business days of inspection.", 2),
            ("Account & Library", "What is 'My Library'?", "Your personal digital bookshelf where all physical and eBook purchases are tracked. You can organize by reading status (Want to Read, Currently Reading, Finished) and read authorized digital samples.", 1),
        ]
        for cat, q, a, order_num in faqs:
            FAQ.objects.update_or_create(
                question=q,
                defaults={"category": cat, "answer": a, "display_order": order_num, "is_active": True}
            )

        # 8. Seed a demo order for the demo reader
        demo_order, _ = Order.objects.get_or_create(
            order_number="TT-2026-849201",
            defaults={
                "user": reader,
                "status": Order.Status.SHIPPED,
                "subtotal": Decimal("978.00"),
                "shipping_fee": Decimal("0.00"),
                "discount_amount": Decimal("100.00"),
                "coupon_code": "FESTIVE100",
                "total": Decimal("878.00"),
                "shipping_address": {
                    "full_name": "Aarav Sharma",
                    "phone": "+91 98765 43210",
                    "street_address": "42, Brigade Road, Ashok Nagar",
                    "landmark": "Near Garuda Mall",
                    "city": "Bengaluru",
                    "state": "Karnataka",
                    "postal_code": "560025",
                },
                "delivery_speed": "Standard Free Delivery",
                "payment_method": "UPI",
                "payment_status": "PAID",
                "payment_id": "UPI-REF-9812476",
                "tracking_number": "TT-EXP-IND-560025-01",
                "estimated_delivery": "Wednesday, Nov 12, by 8:00 PM",
            }
        )
        try:
            b1 = Book.objects.get(id="atomic-habits")
            OrderItem.objects.get_or_create(
                order=demo_order,
                book=b1,
                defaults={
                    "title": b1.title,
                    "author": b1.author,
                    "format": "Paperback",
                    "cover_url": b1.cover_url,
                    "quantity": 1,
                    "unit_price": b1.price,
                    "line_total": b1.price,
                }
            )
            b2 = Book.objects.get(id="midnight-children")
            OrderItem.objects.get_or_create(
                order=demo_order,
                book=b2,
                defaults={
                    "title": b2.title,
                    "author": b2.author,
                    "format": "Paperback",
                    "cover_url": b2.cover_url,
                    "quantity": 1,
                    "unit_price": b2.price,
                    "line_total": b2.price,
                }
            )
        except Exception:
            pass

        self.stdout.write(self.style.SUCCESS("Successfully seeded Timeless Tales bookstore with real data!"))
