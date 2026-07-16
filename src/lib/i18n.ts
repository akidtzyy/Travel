// Auto-detect browser language: if not Indonesian, default to English
const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
const defaultLocale: 'id' | 'en' = browserLang.startsWith('id') ? 'id' : 'en';

export type Locale = 'id' | 'en';

let currentLocale: Locale = defaultLocale;

const listeners: Set<() => void> = new Set();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  listeners.forEach(fn => fn());
}

export function onLocaleChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

type TranslationKeys = typeof translations['id'];

const translations = {
  id: {
    // Admin Login
    adminLogin: 'Masuk Admin',
    email: 'Email',
    password: 'Kata Sandi',
    login: 'Masuk',
    loginSubtitle: 'Masuk ke panel admin untuk mengelola data',
    loggingIn: 'Memproses...',
    loginError: 'Email atau kata sandi salah',
    forgotPassword: 'Lupa kata sandi?',
    backToHome: 'Kembali ke Beranda',
    notAdminMsg: 'Bukan admin? Masuk sebagai pengguna biasa →',

    // User Auth Page
    signInToAccount: 'Masuk ke Akun',
    createNewAccount: 'Buat Akun Baru',
    userSignInSubtitle: 'Masuk untuk melakukan booking dan melihat riwayat perjalanan Anda',
    userSignUpSubtitle: 'Daftar untuk mulai memesan paket wisata impian Anda',
    loginNow: 'Masuk',
    confirmPassword: 'Konfirmasi Kata Sandi',
    registerNow: 'Daftar Sekarang',
    registering: 'Mendaftar...',
    noAccountYet: 'Belum punya akun?',
    signUpFree: 'Daftar sekarang',
    alreadyHaveAccount: 'Sudah punya akun?',
    passwordMinLength: 'Kata sandi minimal 6 karakter.',
    passwordMinLengthHint: 'Minimal 6 karakter',
    confirmPasswordMismatch: 'Konfirmasi kata sandi tidak cocok.',
    emailAlreadyRegistered: 'Email sudah terdaftar. Silakan login atau gunakan email lain.',
    signUpSuccess: 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi, lalu login.',
    loginFailed: 'Email atau kata sandi salah. Silakan coba lagi.',
    genericError: 'Terjadi kesalahan. Silakan coba lagi.',
    copyrightText: '© 2026 ClickAndGo — Wisata Bali Terpercaya',

    // Admin Sidebar
    dashboard: 'Dashboard',
    stockManagement: 'Manajemen Stok',
    customerDatabase: 'Database Pelanggan',
    logout: 'Keluar',
    adminPanel: 'Panel Admin',

    // Dashboard
    welcomeAdmin: 'Selamat Datang, Admin',
    dashboardSubtitle: 'Ringkasan data bisnis Anda',
    totalPackages: 'Total Paket Wisata',
    totalCars: 'Total Armada',
    totalCustomers: 'Total Pelanggan',
    totalBookings: 'Total Booking',
    recentBookings: 'Booking Terbaru',
    noBookings: 'Belum ada booking',

    // Stock Management
    stockTitle: 'Manajemen Stok Mobil & Paket Tour',
    stockSubtitle: 'Tambah, ubah, dan perbarui ketersediaan unit',
    carStock: 'Stok Mobil',
    packageStock: 'Paket Tour',
    addCar: 'Tambah Mobil',
    addPackage: 'Tambah Paket',
    editItem: 'Ubah',
    deleteItem: 'Hapus',
    saveItem: 'Simpan',
    cancelAction: 'Batal',
    carName: 'Nama Mobil',
    carType: 'Tipe Sewa',
    selfDrive: 'Self Drive',
    withDriver: 'Dengan Supir',
    seats: 'Jumlah Kursi',
    pricePerDay: 'Harga',
    durationDesc: 'Deskripsi Durasi',
    imageUrl: 'URL Gambar',
    category: 'Kategori',
    features: 'Fitur (pisahkan dengan koma)',
    available: 'Tersedia',
    unavailable: 'Tidak Tersedia',
    availability: 'Ketersediaan',
    actions: 'Aksi',
    name: 'Nama',
    price: 'Harga',
    confirmDelete: 'Yakin ingin menghapus item ini?',
    deleteSuccess: 'Berhasil dihapus',
    saveSuccess: 'Berhasil disimpan',
    errorOccurred: 'Terjadi kesalahan',
    searchPlaceholder: 'Cari...',
    noData: 'Tidak ada data',
    itemsPerPage: 'item per halaman',
    showing: 'Menampilkan',
    of: 'dari',

    // Package fields
    packageName: 'Nama Paket',
    description: 'Deskripsi',
    duration: 'Durasi',
    highlights: 'Destinasi Utama (pisahkan dengan koma)',

    // Customer Database
    customerTitle: 'Database Pelanggan',
    customerSubtitle: 'Data pengguna yang ingin atau sudah pernah booking',
    addCustomer: 'Tambah Pelanggan',
    fullName: 'Nama Lengkap',
    homeAddress: 'Alamat Rumah',
    birthDate: 'Tanggal Lahir',
    phoneNumber: 'Nomor HP',
    emailAddress: 'Email',
    bookingStatus: 'Status Booking',
    interested: 'Berminat',
    booked: 'Sudah Booking',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    registeredAt: 'Tanggal Daftar',
    editCustomer: 'Ubah Pelanggan',
    customerSaved: 'Data pelanggan berhasil disimpan',
    customerDeleted: 'Data pelanggan berhasil dihapus',
    signUpTitle: 'Formulir Pendaftaran Pelanggan',
    signUpSubtitle: 'Lengkapi data diri untuk mendaftar',
    submitRegistration: 'Daftar Sekarang',
    requiredField: 'Wajib diisi',
    invalidEmail: 'Format email tidak valid',
    invalidPhone: 'Nomor HP tidak valid',
    notes: 'Catatan',

    // Common
    loading: 'Memuat...',
    error: 'Terjadi kesalahan',
    success: 'Berhasil',
    close: 'Tutup',
    confirm: 'Konfirmasi',
    previous: 'Sebelumnya',
    next: 'Selanjutnya',
    all: 'Semua',
    filter: 'Filter',
    export: 'Ekspor',
    refresh: 'Segarkan',
    total: 'Total',
    status: 'Status',
    date: 'Tanggal',
    type: 'Tipe',
    language: 'Bahasa',
    indonesian: 'Indonesia',
    english: 'English',

    // Navbar & Hero
    home: 'Beranda',
    tourPackages: 'Paket Wisata',
    carRental: 'Sewa Mobil',
    destinations: 'Destinasi',
    testimonials: 'Testimoni',
    faq: 'FAQ',
    bookingNow: 'Booking Sekarang',
    signIn: 'Masuk',
    signUp: 'Daftar',
    baliParadise: 'Pulau Dewata, Indonesia',
    exploreBali: 'Jelajahi Keindahan',
    pulauBali: 'Pulau Bali',
    heroSubtitle: 'Temukan pengalaman liburan tak terlupakan dengan paket wisata premium, sewa mobil terpercaya, dan layanan terbaik untuk perjalanan impian Anda di Bali.',
    viewTourPackages: 'Lihat Paket Wisata',
    tripsCompleted: 'Trip Selesai',
    rating: 'Rating',
    happyTravelers: 'Happy Traveler',

    // Why Choose Us
    whyChooseUs: 'Mengapa Memilih Kami?',
    whyChooseUsSubtitle: 'Layanan profesional terbaik untuk menjamin kenyamanan dan keamanan liburan Anda di Bali.',
    premiumPackages: 'Paket Premium',
    premiumPackagesDesc: 'Pilihan paket tour terbaik dengan destinasi terpopuler dan hotel berkualitas.',
    easyCarRental: 'Sewa Mobil Mudah',
    easyCarRentalDesc: 'Armada terawat, bersih, dan siap dengan pilihan lepas kunci atau plus driver.',
    support247: 'Layanan 24/7',
    support247Desc: 'Tim support kami siap membantu perjalanan Anda kapan pun dibutuhkan.',

    // Destinations Section
    popularDestinations: 'Destinasi Terpopuler',
    popularDestinationsSubtitle: 'Jelajahi tempat-tempat ikonik dan keindahan alam Bali yang menakjubkan.',

    // Testimonials Section
    whatTheySay: 'Apa Kata Mereka?',
    whatTheySaySubtitle: 'Ulasan jujur dari para wisatawan yang telah menikmati liburan bersama kami.',

    // FAQ Section
    faqTitle: 'Pertanyaan Umum (FAQ)',
    faqSubtitle: 'Temukan jawaban atas pertanyaan-pertanyaan yang sering diajukan mengenai layanan kami.',

    // Booking Form
    bookingFormTitle: 'Formulir Booking Perjalanan',
    bookingFormSubtitle: 'Pilih paket liburan atau sewa mobil impian Anda dan lengkapi data di bawah ini',
    bookingType: 'Jenis Booking',
    selectTourPackage: 'Pilih Paket Wisata',
    selectCarRental: 'Pilih Armada Mobil',
    selectHotelOption: 'Pilih Pilihan Hotel',
    selectPaxCapacity: 'Pilih Kapasitas Pax',
    startDateRent: 'Mulai Tanggal Sewa',
    startDateTour: 'Mulai Tanggal Tour',
    rentDuration: 'Durasi Sewa (Hari)',
    whatsAppNumber: 'Nomor WhatsApp',
    additionalNotes: 'Catatan Tambahan (Opsional)',
    costEstimation: 'Rincian Estimasi Biaya',
    itemName: 'Nama Item',
    details: 'Rincian',
    totalCost: 'Total Biaya',
    contactViaWhatsApp: 'Hubungi Via WhatsApp',
    signInToBook: 'Masuk untuk Melanjutkan Booking',
    sendingData: 'Mengirim data...',
    bookingSuccess: 'Booking Berhasil!',
    bookingSuccessDesc: 'Terima kasih! Kami akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi pembayaran.',
    
    // Package Card specific
    destinationsLabel: 'Destinasi',
    viewFullItinerary: 'Lihat Itinerary Lengkap',
    includedExcludedDetails: 'Detail Termasuk & Tidak Termasuk',
    includedInPackage: 'Termasuk dalam Paket',
    notIncluded: 'Tidak Termasuk',
    hotelOptions: 'Pilihan Hotel',
    hotelOptionsCouple: 'Pilihan Hotel (Harga per Couple)',
    startingFrom: 'Mulai dari',
    pax: 'pax',
    couple: 'couple',

    // Car Rental specific
    sewaMobilBali: 'Sewa Mobil Bali',
    sewaMobilSubtitle: 'Armada terpercaya, bersih, dan terawat untuk kenyamanan perjalanan Anda selama di Bali.',
    allCars: 'Semua',
    lepasKunciSelfDrive: 'Lepas Kunci (Self Drive)',
    denganSupirWithDriver: 'Dengan Supir (With Driver)',
    bbmTermasuk: 'BBM Termasuk',
    pesan: 'Pesan',

    // Booking Management
    bookingManagement: 'Kelola Booking',
    bookingId: 'ID Booking',
    paymentStatus: 'Status Pembayaran',
    unpaid: 'Belum Lunas',
    paid: 'Lunas',
    pending: 'Tertunda',
    confirmed: 'Dikonfirmasi',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    invoice: 'Faktur / Invoice',
    printInvoice: 'Cetak Invoice',
    confirmBooking: 'Konfirmasi Booking',
    cancelBooking: 'Batalkan Booking',
    bookingDetails: 'Detail Booking',
    bookingSaved: 'Data booking berhasil diperbarui',
    bookingDeleted: 'Booking berhasil dihapus',
    bookingType: 'Tipe Booking',
    days: 'Hari',
  },
  en: {
    // Admin Login
    adminLogin: 'Admin Login',
    email: 'Email',
    password: 'Password',
    login: 'Sign In',
    loginSubtitle: 'Sign in to the admin panel to manage data',
    loggingIn: 'Signing in...',
    loginError: 'Invalid email or password',
    forgotPassword: 'Forgot password?',
    backToHome: 'Back to Home',
    notAdminMsg: 'Not an admin? Log in as regular user →',

    // User Auth Page
    signInToAccount: 'Sign In to Account',
    createNewAccount: 'Create New Account',
    userSignInSubtitle: 'Sign in to make bookings and view your travel history',
    userSignUpSubtitle: 'Register to start booking your dream tour packages',
    loginNow: 'Sign In',
    confirmPassword: 'Confirm Password',
    registerNow: 'Register Now',
    registering: 'Registering...',
    noAccountYet: 'Don\'t have an account?',
    signUpFree: 'Register now',
    alreadyHaveAccount: 'Already have an account?',
    passwordMinLength: 'Password must be at least 6 characters.',
    passwordMinLengthHint: 'Minimum 6 characters',
    confirmPasswordMismatch: 'Confirm password does not match.',
    emailAlreadyRegistered: 'Email already registered. Please login or use another email.',
    signUpSuccess: 'Registration successful! Please check your email for verification, then login.',
    loginFailed: 'Invalid email or password. Please try again.',
    genericError: 'An error occurred. Please try again.',
    copyrightText: '© 2026 ClickAndGo — Trusted Bali Travel',

    // Admin Sidebar
    dashboard: 'Dashboard',
    stockManagement: 'Stock Management',
    customerDatabase: 'Customer Database',
    logout: 'Sign Out',
    adminPanel: 'Admin Panel',

    // Dashboard
    welcomeAdmin: 'Welcome, Admin',
    dashboardSubtitle: 'Your business data summary',
    totalPackages: 'Total Tour Packages',
    totalCars: 'Total Fleet',
    totalCustomers: 'Total Customers',
    totalBookings: 'Total Bookings',
    recentBookings: 'Recent Bookings',
    noBookings: 'No bookings yet',

    // Stock Management
    stockTitle: 'Car & Tour Package Stock Management',
    stockSubtitle: 'Add, edit, and update unit availability',
    carStock: 'Car Stock',
    packageStock: 'Tour Packages',
    addCar: 'Add Car',
    addPackage: 'Add Package',
    editItem: 'Edit',
    deleteItem: 'Delete',
    saveItem: 'Save',
    cancelAction: 'Cancel',
    carName: 'Car Name',
    carType: 'Rental Type',
    selfDrive: 'Self Drive',
    withDriver: 'With Driver',
    seats: 'Seats',
    pricePerDay: 'Price',
    durationDesc: 'Duration Description',
    imageUrl: 'Image URL',
    category: 'Category',
    features: 'Features (comma separated)',
    available: 'Available',
    unavailable: 'Unavailable',
    availability: 'Availability',
    actions: 'Actions',
    name: 'Name',
    price: 'Price',
    confirmDelete: 'Are you sure you want to delete this item?',
    deleteSuccess: 'Successfully deleted',
    saveSuccess: 'Successfully saved',
    errorOccurred: 'An error occurred',
    searchPlaceholder: 'Search...',
    noData: 'No data available',
    itemsPerPage: 'items per page',
    showing: 'Showing',
    of: 'of',

    // Package fields
    packageName: 'Package Name',
    description: 'Description',
    duration: 'Duration',
    highlights: 'Main Destinations (comma separated)',

    // Customer Database
    customerTitle: 'Customer Database',
    customerSubtitle: 'Users who are interested or have booked',
    addCustomer: 'Add Customer',
    fullName: 'Full Name',
    homeAddress: 'Home Address',
    birthDate: 'Date of Birth',
    phoneNumber: 'Phone Number',
    emailAddress: 'Email',
    bookingStatus: 'Booking Status',
    interested: 'Interested',
    booked: 'Booked',
    completed: 'Completed',
    cancelled: 'Cancelled',
    registeredAt: 'Registered At',
    editCustomer: 'Edit Customer',
    customerSaved: 'Customer data saved successfully',
    customerDeleted: 'Customer data deleted successfully',
    signUpTitle: 'Customer Registration Form',
    signUpSubtitle: 'Complete your details to register',
    submitRegistration: 'Register Now',
    requiredField: 'Required',
    invalidEmail: 'Invalid email format',
    invalidPhone: 'Invalid phone number',
    notes: 'Notes',

    // Common
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    close: 'Close',
    confirm: 'Confirm',
    previous: 'Previous',
    next: 'Next',
    all: 'All',
    filter: 'Filter',
    export: 'Export',
    refresh: 'Refresh',
    total: 'Total',
    status: 'Status',
    date: 'Date',
    type: 'Type',
    language: 'Language',
    indonesian: 'Indonesia',
    english: 'English',

    // Navbar & Hero
    home: 'Home',
    tourPackages: 'Tour Packages',
    carRental: 'Car Rental',
    destinations: 'Destinations',
    testimonials: 'Testimonials',
    faq: 'FAQ',
    bookingNow: 'Book Now',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    baliParadise: 'Island of the Gods, Indonesia',
    exploreBali: 'Explore the Beauty of',
    pulauBali: 'Bali Island',
    heroSubtitle: 'Discover unforgettable holiday experiences with premium tour packages, trusted car rentals, and the best services for your dream trip to Bali.',
    viewTourPackages: 'View Tour Packages',
    tripsCompleted: 'Trips Completed',
    rating: 'Rating',
    happyTravelers: 'Happy Travelers',

    // Why Choose Us
    whyChooseUs: 'Why Choose Us?',
    whyChooseUsSubtitle: 'The best professional services to ensure the comfort and safety of your vacation in Bali.',
    premiumPackages: 'Premium Packages',
    premiumPackagesDesc: 'The best selection of tour packages with popular destinations and quality hotels.',
    easyCarRental: 'Easy Car Rental',
    easyCarRentalDesc: 'Well-maintained, clean fleet, ready with self-drive or driver-included options.',
    support247: '24/7 Support',
    support247Desc: 'Our support team is ready to assist your journey whenever needed.',

    // Destinations Section
    popularDestinations: 'Popular Destinations',
    popularDestinationsSubtitle: 'Explore iconic places and the breathtaking natural beauty of Bali.',

    // Testimonials Section
    whatTheySay: 'What They Say',
    whatTheySaySubtitle: 'Honest reviews from travelers who have enjoyed their holiday with us.',

    // FAQ Section
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Find answers to frequently asked questions about our services.',

    // Booking Form
    bookingFormTitle: 'Trip Booking Form',
    bookingFormSubtitle: 'Select your dream tour package or car rental and complete the details below',
    bookingType: 'Booking Type',
    selectTourPackage: 'Select Tour Package',
    selectCarRental: 'Select Car Model',
    selectHotelOption: 'Select Hotel Option',
    selectPaxCapacity: 'Select Pax Capacity',
    startDateRent: 'Rental Start Date',
    startDateTour: 'Tour Start Date',
    rentDuration: 'Rental Duration (Days)',
    whatsAppNumber: 'WhatsApp Number',
    additionalNotes: 'Additional Notes (Optional)',
    costEstimation: 'Estimated Cost Details',
    itemName: 'Item Name',
    details: 'Details',
    totalCost: 'Total Cost',
    contactViaWhatsApp: 'Contact Via WhatsApp',
    signInToBook: 'Sign In to Continue Booking',
    sendingData: 'Sending data...',
    bookingSuccess: 'Booking Successful!',
    bookingSuccessDesc: 'Thank you! We will contact you via WhatsApp shortly to confirm your payment.',

    // Package Card specific
    destinationsLabel: 'Destinations',
    viewFullItinerary: 'View Full Itinerary',
    includedExcludedDetails: 'Included & Excluded Details',
    includedInPackage: 'Included in Package',
    notIncluded: 'Not Included',
    hotelOptions: 'Hotel Options',
    hotelOptionsCouple: 'Hotel Options (Price per Couple)',
    startingFrom: 'Starting from',
    pax: 'pax',
    couple: 'couple',

    // Car Rental specific
    sewaMobilBali: 'Bali Car Rental',
    sewaMobilSubtitle: 'Trusted, clean, and well-maintained fleet for your travel comfort in Bali.',
    allCars: 'All',
    lepasKunciSelfDrive: 'Self Drive',
    denganSupirWithDriver: 'With Driver',
    bbmTermasuk: 'Fuel Included',
    pesan: 'Book',

    // Booking Management
    bookingManagement: 'Booking Management',
    bookingId: 'Booking ID',
    paymentStatus: 'Payment Status',
    unpaid: 'Unpaid',
    paid: 'Paid',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    invoice: 'Invoice',
    printInvoice: 'Print Invoice',
    confirmBooking: 'Confirm Booking',
    cancelBooking: 'Cancel Booking',
    bookingDetails: 'Booking Details',
    bookingSaved: 'Booking data successfully updated',
    bookingDeleted: 'Booking successfully deleted',
    bookingType: 'Booking Type',
    days: 'Days',
  },
} as const;

const dbTranslations: Record<string, string> = {
  // Tour Categories / Categories
  '3D2N': '3D2N',
  'Honeymoon': 'Honeymoon',
  'Temple': 'Temple',
  'Nature': 'Nature',
  'Island': 'Island',
  'Beach': 'Beach',

  // Package Names
  'Paket KUMPI': 'KUMPI Package',
  'Paket MEKDE': 'MEKDE Package',
  'Paket Bulan Madu': 'Honeymoon Package',
  'Paket Soleh': 'Soleh Package',
  'Paket Mbokde': 'Mbokde Package',

  // Package Descriptions
  '3 Hari 2 Malam paket terlengkap! Bali Selatan, Kintamani, Bedugul, Tanah Lot — semua destinasi utama Bali dalam satu paket premium.': '3 Days 2 Nights ultimate tour package! South Bali, Kintamani, Bedugul, Tanah Lot — all of Bali\'s main destinations in one premium package.',
  '3 Hari 2 Malam paket petualangan lengkap! Bali Selatan, Nusa Penida Island hopping, dan Kintamani. Semua destinasi terbaik Bali dalam satu perjalanan.': '3 Days 2 Nights adventure package! South Bali, Nusa Penida Island hopping, and Kintamani. All of Bali\'s best destinations in one trip.',
  'Paket romantis eksklusif untuk pasangan pengantin baru. Dinner cruise, spa couple, foto adat Bali, dan wisata Nusa Penida — pengalaman honeymoon impian!': 'An exclusive romantic package for newlyweds. Dinner cruise, couple\'s spa, Balinese traditional costume photoshoot, and Nusa Penida tour — a dream honeymoon experience!',
  '3 Hari 2 Malam menikmati keindahan Bali Selatan. Penjemputan bandara, wisata pantai, budaya, belanja, dan kuliner seafood Jimbaran.': '3 Days 2 Nights exploring the beauty of South Bali. Airport pickup, beach tours, culture, shopping, and Jimbaran seafood culinary.',
  '3 Hari 2 Malam eksplorasi Bali Selatan + Kintamani. Termasuk Penglipuran, Kintamani view gunung, Alas Harum, dan kuliner terbaik.': '3 Days 2 Nights South Bali & Kintamani exploration. Includes Penglipuran Village, Kintamani volcanic view, Alas Harum, and premium culinary.',

  // Package Durations
  '3 Hari 2 Malam': '3 Days 2 Nights',

  // Package Highlights & Activities & Inclusions/Exclusions
  'Penjemputan Bandara': 'Airport Pick-up',
  'Kalungan Bunga': 'Welcome Flower Garland',
  'Tanjung Benoa (Optional)': 'Tanjung Benoa Watersport (Optional)',
  'Pandawa Beach': 'Pandawa Beach',
  'Tanah Barak': 'Tanah Barak Cliff',
  'Krisna Oleh-Oleh': 'Krisna Souvenirs',
  'Joger': 'Joger Shopping',
  'Kuta': 'Kuta',
  'Seafood Jimbaran': 'Jimbaran Seafood Dinner',
  'Penglipuran': 'Penglipuran Village',
  'Kintamani': 'Kintamani',
  'Sangeh': 'Sangeh Monkey Forest',
  'Bedugul': 'Bedugul',
  'Tanah Lot': 'Tanah Lot Temple',
  'Ayam Betutu Bu Mira': 'Ayam Betutu Bu Mira',
  'Nusa Penida': 'Nusa Penida',
  'Kelingking Beach': 'Kelingking Beach',
  'Broken Beach': 'Broken Beach',
  'Angel Billabong': 'Angel\'s Billabong',
  'Crystal Bay': 'Crystal Bay',
  'Alas Harum / Uma Ceking': 'Alas Harum / Uma Ceking',
  'Jungle Gold Coklat': 'Jungle Gold Chocolate',
  'Tanjung Benoa + Glass Bottom Boat': 'Tanjung Benoa + Glass Bottom Boat',
  'Uluwatu Temple': 'Uluwatu Temple',
  'Seafood Jimbaran Hiasan Honeymoon': 'Jimbaran Seafood Dinner (Honeymoon Setup)',
  'Foto Adat Bali': 'Traditional Balinese Costume Photo',
  'Spa 2 Jam': '2-Hour Spa Treatment',
  'Pirate/Phinisi Dinner Cruise': 'Pirate/Phinisi Dinner Cruise',
  'Grand Puncak Sari Rest': 'Grand Puncak Sari Restaurant',
  'Shera Rest': 'Shera Restaurant',
  
  // Excludes
  'Tiket pesawat': 'Flight tickets',
  'Porter': 'Porter service',
  'Tip': 'Tips / Gratuities',
  'Pengeluaran pribadi': 'Personal expenses',

  // Includes
  'Hotel 2 malam dengan sarapan (sekamar berdua)': '2 nights hotel stay with breakfast (double sharing)',
  'Transport AC: Xenia/Xpander/Stargazer (2-4 orang tanpa guide)': 'AC Transport: Xenia/Xpander/Stargazer (2-4 pax without guide)',
  'Hiace (6-14 orang tanpa guide)': 'Hiace (6-14 pax without guide)',
  'Bus (15-30 orang dengan guide HPI)': 'Bus (15-30 pax with licensed tour guide)',
  'Tiket masuk semua objek wisata': 'Entrance tickets to all tourist destinations',
  'Fastboat PP ke Nusa Penida': 'Return fastboat tickets to Nusa Penida',
  'Parkir & Toll': 'Parking & Toll fees',
  'Mineral water': 'Bottled mineral water',
  'Makan sesuai acara': 'Meals as per itinerary',

  // Day Titles
  'Hari 1 — Bali Selatan': 'Day 1 — South Bali',
  'Hari 2 — Kintamani': 'Day 2 — Kintamani',
  'Hari 3 — Bedugul & Tanah Lot': 'Day 3 — Bedugul & Tanah Lot',
  'Hari 1 — Nusa Penida Island': 'Day 1 — Nusa Penida Island',
  'Hari 2 — Nusa Penida Island': 'Day 2 — Nusa Penida Island',
  'Hari 3 — Kintamani & Kepulangan': 'Day 3 — Kintamani & Departure',
  'Hari 1 — Kedatangan Romantis': 'Day 1 — Romantic Arrival',
  'Hari 2 — Pengalaman Romantis': 'Day 2 — Romantic Experience',
  'Hari 3 — Nusa Penida & Kepulangan': 'Day 3 — Nusa Penida & Departure',
  'Hari 1 — Kedatangan': 'Day 1 — Arrival',
  'Hari 2 — Bali Selatan': 'Day 2 — South Bali',
  'Hari 3 — Kepulangan': 'Day 3 — Departure',

  // Activities
  'Penjemputan di bandara': 'Airport pick-up',
  'Kalungan bunga selamat datang': 'Welcome flower garland',
  'Tanjung Benoa': 'Tanjung Benoa watersport',
  'Makan siang di Bu OKI': 'Lunch at Bu Oki (Balinese Nasi Campur)',
  'Keranjang oleh-oleh / Krisna': 'Krisna souvenirs shopping',
  'Sarapan di hotel': 'Breakfast at hotel',
  'Penglipuran Village': 'Penglipuran Traditional Village',
  'Kintamani (view Gunung Batur)': 'Kintamani (Mount Batur View)',
  'Makan siang di Grand Puncak Sari Rest': 'Lunch at Grand Puncak Sari Restaurant (Buffet)',
  'Makan malam di Shera Rest': 'Dinner at Shera Restaurant',
  'Sangeh Monkey Forest': 'Sangeh Monkey Forest',
  'Makan siang di Ulun Danu Rest': 'Lunch at Ulun Danu Restaurant',
  'Makan malam Ayam Betutu Bu Mira': 'Dinner at Ayam Betutu Bu Mira',
  'Fastboat ke Nusa Penida': 'Fastboat crossing to Nusa Penida',
  'Makan siang di BMS Rest': 'Lunch at BMS Restaurant',
  'Free Glass Bottom Boat': 'Complimentary Glass Bottom Boat tour',
  'Makan malam seafood Jimbaran dengan hiasan honeymoon': 'Jimbaran seafood dinner with honeymoon setup',
  'Foto adat pakai baju Bali': 'Traditional Balinese dress photo session',
  'Spa couple 2 jam': '2-hour couple spa treatment',
  'Pirate / Phinisi Dinner Cruise': 'Pirate / Phinisi Romantic Dinner Cruise',
  'Drop ke hotel, acara bebas': 'Drop-off at hotel, free program',
  'Makan malam seafood Jimbaran (Aroma / New Dewata Cafe / Tepi Pantai)': 'Jimbaran beach seafood dinner (Aroma / New Dewata Cafe / Beachfront)',
  'Makan malam seafood Jimbaran': 'Jimbaran seafood dinner',
  'Drop ke hotel': 'Drop-off at hotel',
  'Drop ke airport': 'Airport drop-off',
  'Drop ke Bandara': 'Airport drop-off',
  'Drop ke bandara': 'Airport drop-off',

  // Destinations
  'Pura Uluwatu': 'Uluwatu Temple',
  'Pura megah di atas tebing setinggi 70 meter dari permukaan laut. Tempat terbaik menonton sunset dan pertunjukan Kecak Dance.': 'A majestic temple standing on a 70-meter cliff above the sea. The best spot for sunsets and Kecak Dance performances.',
  'Tegallalang Rice Terrace': 'Tegallalang Rice Terrace',
  'Sawah terasering ikonik di Ubud dengan pemandangan hijau yang memukau. Spot foto instagramable populer.': 'Iconic terraced rice paddies in Ubud with stunning green views. A popular instagrammable photo spot.',
  'Pura laut yang berdiri di atas batu karang di tengah laut. Sunset paling spektakuler di Bali.': 'A sea temple sitting on a rock in the middle of the sea. The most spectacular sunset in Bali.',
  'Pantai Kuta': 'Kuta Beach',
  'Pantai legendaris dengan ombak sempurna untuk surfing pemula. Sunset dan nightlife yang meriah.': 'A legendary beach with perfect waves for beginner surfers. Vibrant sunsets and lively nightlife.',
  'Pura Tirta Empul': 'Tirta Empul Temple',
  'Pura suci dengan mata air alami untuk ritual melukat (pembersihan spiritual) yang sakral.': 'A sacred temple with natural springs for holy purification rituals (melukat).',

  // Cars
  'Daihatsu Xenia': 'Daihatsu Xenia',
  'Mitsubishi Xpander': 'Mitsubishi Xpander',
  'Hyundai Stargazer': 'Hyundai Stargazer',
  'Toyota Reborn': 'Toyota Reborn',
  'Toyota Zenix': 'Toyota Zenix',
  'Elf Short': 'Elf Short',
  'Elf Long': 'Elf Long',
  'Bus 35 Seat': 'Bus 35 Seat',
  'Bus 45 Seat': 'Bus 45 Seat',
  'Toyota Hiace': 'Toyota Hiace',
  'Xenia / Xpander / Stargazer': 'Xenia / Xpander / Stargazer',

  // Car Rental duration and type
  'self_drive': 'Self Drive',
  'with_driver': 'With Driver',
  'Per Hari (24 Jam)': 'Per Day (24 Hours)',
  'Per Hari (24 Jam)`': 'Per Day (24 Hours)',
  '12 Jam': '12 Hours',
  'Lepas Kunci': 'Self Drive',
  'Dengan Supir': 'With Driver',

  // Car features
  'Manual/AT': 'Manual/AT',
  'AC Double': 'Double AC',
  '7 Seater': '7 Seats',
  'AT': 'Automatic',
  'Luas': 'Spacious',
  'Modern': 'Modern',
  'Captain Seat': 'Captain Seats',
  'Hybrid AT': 'Hybrid AT',
  'Sunroof': 'Sunroof',
  'Driver Pro': 'Professional Driver',
  '12 Seat': '12 Seats',
  '18 Seat': '18 Seats',
  '35 Seat': '35 Seats',
  '45 Seat': '45 Seats',
  '15 Seat': '15 Seats',

  // Testimonials
  'Singapura': 'Singapore',
  'Tokyo, Jepang': 'Tokyo, Japan',
  'Desember 2024': 'December 2024',
  'November 2024': 'November 2024',
  'Oktober 2024': 'October 2024',
  'Januari 2025': 'January 2025',
  'Februari 2025': 'February 2025',
  'Pengalaman luar biasa! Guide sangat ramah dan profesional. Itinerary yang dirancang sangat pas, tidak terlalu terburu-buru. Pasti akan pakai jasa mereka lagi!': 'An amazing experience! The guide was very friendly and professional. The itinerary was perfectly designed, not rushed at all. Will definitely use their services again!',
  'Sewa mobil di sini paling recommended. Mobil bersih, terawat, dan drivernya sangat tahu jalan-jalan di Bali. Harga juga sangat reasonable.': 'Renting a car here is highly recommended. The car was clean, well-maintained, and the driver knew the roads in Bali very well. The price was also very reasonable.',
  'Perjalanan Bali yang luar biasa! Tur Nusa Penida sangat menakjubkan. Pemandu kami sangat berpengetahuan luas dan membuat perjalanan sangat menyenangkan. Sangat direkomendasikan!': 'Amazing Bali trip! The Nusa Penida tour was breathtaking. Our guide was very knowledgeable and made the trip so much fun. Highly recommended!',
  'Paket honeymoon-nya romantis banget! Sunset dinner dan spa couple-nya memorable. Satu-satunya minus cuma cuaca yang kadang hujan.': "The honeymoon package was so romantic! The sunset dinner and couple's spa were memorable. The only downside was the weather, which was occasionally rainy.",
  'Liburan keluarga paling berkesan! Anak-anak senang banget di Bali Safari dan Waterbom. Driver-nya sabar dan ramah sama anak-anak.': 'The most memorable family holiday! The children loved Bali Safari and Waterbom. The driver was patient and friendly with the kids.',
  'Agen perjalanan terbaik di Bali! Sangat responsif di WhatsApp, fleksibel dengan perubahan jadwal, dan mobil selalu bersih serta nyaman.': 'Best travel agency in Bali! Very responsive on WhatsApp, flexible with schedule changes, and the car was always clean and comfortable.',

  // FAQ - Questions & Answers
  'Bagaimana cara memesan paket wisata atau sewa mobil?': 'How do I book a tour package or rent a car?',
  'Anda bisa langsung mengisi form booking di website kami atau menghubungi via WhatsApp di +62 812-4349-9265. Tim kami akan merespons dalam 1x24 jam untuk konfirmasi ketersediaan dan detail pembayaran.': 'You can directly fill out the booking form on our website or contact us via WhatsApp at +62 812-4349-9265. Our team will respond within 24 hours to confirm availability and payment details.',
  'Apa saja metode pembayaran yang diterima?': 'What payment methods are accepted?',
  'Kami menerima transfer bank (BCA, Mandiri, BNI), e-wallet (GoPay, OVO, Dana), dan pembayaran tunai. DP minimal 50% saat booking, pelunasan H-1 sebelum trip.': 'We accept bank transfers (BCA, Mandiri, BNI), e-wallets (GoPay, OVO, Dana), and cash payments. A minimum 50% deposit is required upon booking, with full payment due 1 day before the trip.',
  'Apakah bisa cancel atau reschedule?': 'Is it possible to cancel or reschedule?',
  'Pembatalan H-3 sebelum trip mendapat full refund. Reschedule bisa dilakukan maksimal H-2 tanpa biaya tambahan. Untuk pembatalan di bawah H-3, DP tidak dapat dikembalikan.': 'Cancellations made 3 days before the trip receive a full refund. Reschedules can be made up to 2 days before without additional fees. For cancellations within 3 days, the deposit is non-refundable.',
  'Apa saja syarat sewa mobil self drive?': 'What are the requirements for self-drive car rental?',
  'Syarat: KTP/SIM A yang masih berlaku, deposit Rp 500.000 (dikembalikan saat mobil dikembalikan), dan tanda tangan perjanjian sewa. Mobil diantar ke lokasi Anda di area Kuta, Seminyak, Legian, dan Nusa Dua.': "Requirements: Valid ID/driver's license (SIM A), a deposit of IDR 500,000 (refunded upon car return), and signing the rental agreement. The car will be delivered to your location in Kuta, Seminyak, Legian, and Nusa Dua areas.",
  'Apakah harga sudah termasuk semua biaya?': 'Are all fees included in the price?',
  'Untuk paket wisata, harga sudah termasuk transportasi, guide, tiket masuk, dan makan sesuai paket. Untuk sewa mobil with driver, harga sudah termasuk BBM dan driver. Self drive belum termasuk BBM.': 'For tour packages, the price includes transportation, a guide, entrance tickets, and meals as specified. For car rental with a driver, the price includes fuel and driver. Self-drive does not include fuel.',
  'Berapa lama durasi tour harian?': 'How long is the daily tour duration?',
  'Tour harian biasanya 10-12 jam dimulai dari penjemputan di hotel. Waktu mulai fleksibel sesuai permintaan, umumnya jam 08:00-09:00 WITA. Overtime charge 10% per jam dari harga paket.': 'Daily tours usually last 10-12 hours starting from hotel pick-up. Start time is flexible as requested, generally between 08:00-09:00 WITA. Overtime is charged at 10% per hour of the package price.',
  'Apakah tersedia penjemputan di bandara?': 'Is airport pick-up available?',
  'Ya, kami menyediakan layanan airport transfer dengan biaya tambahan mulai dari Rp 150.000 tergantung jenis kendaraan. Silakan informasikan detail penerbangan saat booking.': 'Yes, we provide airport transfer services at an additional charge starting from IDR 150,000 depending on the vehicle type. Please inform us of your flight details when booking.',
  'Apakah anak-anak dihitung dalam harga paket?': 'Are children counted in the package price?',
  'Anak usia 0-4 tahun gratis (tanpa seat tambahan). Anak usia 5-10 tahun mendapat diskon 50%. Di atas 10 tahun dihitung harga normal. Baby seat tersedia tanpa biaya tambahan.': 'Children aged 0-4 years are free of charge (no extra seat). Children aged 5-10 years receive a 50% discount. Above 10 years are charged standard rates. A baby seat is available at no extra cost.'
};

// Generate English-to-Indonesian dictionary automatically from dbTranslations
const enToIdTranslations: Record<string, string> = {};
for (const [idText, enText] of Object.entries(dbTranslations)) {
  if (enText && !(enText in enToIdTranslations)) {
    enToIdTranslations[enText] = idText;
  }
}

export function translateText(text: string): string {
  if (!text) return text;
  if (currentLocale === 'en' && text in dbTranslations) {
    return dbTranslations[text];
  }
  if (currentLocale === 'id' && text in enToIdTranslations) {
    return enToIdTranslations[text];
  }
  return text;
}

export function t(key: keyof TranslationKeys): string {
  return translations[currentLocale]?.[key] || translations['en'][key] || key;
}

export { defaultLocale };
