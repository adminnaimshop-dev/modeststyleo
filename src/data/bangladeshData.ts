
export const DIVISIONS = [
  "Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"
];

export const DISTRICTS: Record<string, string[]> = {
  "Dhaka": ["Dhaka", "Gazipur", "Narayanganj", "Manikganj", "Munshiganj", "Narsingdi", "Faridpur", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur", "Kishoreganj", "Tangail"],
  "Chattogram": ["Chattogram", "Cox's Bazar", "Rangamati", "Bandarban", "Khagrachhari", "Feni", "Lakshmipur", "Cumilla", "Noakhali", "Brahmanbaria", "Chandpur"],
  "Rajshahi": ["Rajshahi", "Natore", "Naogaon", "Chapai Nawabganj", "Pabna", "Sirajganj", "Bogura", "Joypurhat"],
  "Khulna": ["Khulna", "Jashore", "Satkhira", "Meherpur", "Narail", "Chuadanga", "Kushtia", "Magura", "Bagerhat", "Jhenaidah"],
  "Barishal": ["Barishal", "Patuakhali", "Bhola", "Pirojpur", "Barguna", "Jhalokathi"],
  "Sylhet": ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  "Rangpur": ["Rangpur", "Gaibandha", "Nilphamari", "Kurigram", "Lalmonirhat", "Dinajpur", "Thakurgaon", "Panchagarh"],
  "Mymensingh": ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"]
};

export const UPAZILAS: Record<string, string[]> = {
  "Dhaka": ["Adabor", "Badda", "Bangsal", "Bimanbandar", "Cantonment", "Chak Bazar", "Dakshinkhan", "Daru Salam", "Dhanmondi", "Demra", "Gendaria", "Gulshan", "Hazaribagh", "Jatrabari", "Kadamtali", "Kafrul", "Kalabagan", "Kamrangirchar", "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh", "Mirpur", "Mohammadpur", "Motijheel", "New Market", "Pallabi", "Paltan", "Panthapath", "Ramna", "Rampura", "Sabujbagh", "Shah Ali", "Shahbagh", "Sher-e-Bangla Nagar", "Shyampur", "Sutrapur", "Tejgaon", "Tejgaon Industrial Area", "Turag", "Uttara", "Uttar Khan", "Vatara", "Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar"],
  "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"],
  "Chattogram": ["Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari", "Hathazari", "Lohagara", "Mirsharai", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda"],
  "Cumilla": ["Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Muradnagar", "Nangalkot", "Cumilla Sadar", "Meghna", "Monohargonj", "Sadarsouth", "Titas"],
  // Slicing for brevity, can be expanded as needed.
};
