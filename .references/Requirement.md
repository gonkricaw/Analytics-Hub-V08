# **User Requirement Web Apps (Analytics Hub)**

Sebuah sistem aplikasi web yang menampilkan informasi Analytics dari Content yang dibuat secara custom static text atau HTML dan Embed report dari seperti Microsoft PowerBI, Tableau, Google Data Studio.

Aplikasi ini tidak memiliki Landing Page jadi ketika akses akan langsung diarahkan ke halaman Login, dihalaman login sendiri hanya ada form login dan button forget password, tidak ada button registration, Jadi hanya user yang di undang oleh System Administrator dan Administrator untuk dapat mengakses aplikasi web ini.

**Fungsi yang dibutuhkan:**

1. Permission Management.  
   1. Membuat Permission seperti Create, Edit, Read / View dan Delete  
   2. Yang dapat membuat Permission hanya Roles tertentu yang dapat membuat Permission seperti System Administrator.  
2. Role Management.  
   1. Membuat Roles seperti System Administrator, Administrator, Stakeholder, Management, Manajer, Leader dan Officer.  
   2. Yang dapat Create, Edit, Read / View dan Delete Roles hanya System Administrator dan Administrator.  
   3. Role berfungsi sebagai Hak akses untuk setiap Menu dan Content yang diperbolehkan, Contohnya System Administrator dapat melihat semua Menu dan Content yang tersedia, sedangkan untuk yang lainnya hanya dapat mengakses beberapa Menu dan Content yang diperbolehkan.  
   4. Jadi setiap Role yang dibuat harus menentukan Menu dan Content mana saja yang diperbolehkan.  
   5. Jika sebuah Role tidak mendapatkan Hak akses maka Menu dan Content tidak akan tampil.  
3. Users Management.  
   1. Membuat User akses yang baru untuk di undang agar dapat mengakses kedalam web aplikasi.  
   2. Yang dapat Create, Suspend dan Delete User hanya System Administrator dan Administrator.  
   3. Setiap User yang di Create harus menentukan Role dan Photo Profile yang ditentukan lalu User yang berhasil di Create akan mendapatkan Undangan melalui email yang didaftarkan berupa informasi akses login (email) dan Temporary password (Random Password Generate 8 karakter yang dikombinasikan Huruf Besar, Huruf Kecil dan Angka).  
   4. Memilih photo profile default yang akan digunakan pada pembuatan User baru dapat dipilih pada image yang tersedia atau upload image.  
   5. User dengan status Suspend tidak dapat melakukan login kedalam aplikasi.  
   6. User dengan status Suspend hanya dapat di un-Suspend oleh System Administrator dan Administrator.  
4. Menu Management.  
   1. Membuat daftar Menu maksimal sampai 3 level turunannya, seperti Root 1A → Child 1A → Child 2A atau Root 1B → Child 1B dan seterusnya.  
   2. Menu hanya dapat Create, Edit, Delete oleh System Administrator dan Administrator.  
   3. Setiap menu yang dibuat harus ditentukan penggunaan Icon dan Index sequencenya, Nantinya menu akan tampil dengan Icon dan berurutan sesuai dengan nilai Index yang ditentukan.  
5. Content Management.  
   1. Membuat Content dengan 2 tipe yaitu Custom dan Embed.  
   2. Hanya System Administrator dan Administrator yang dapat melakukan Create, Edit dan Delete.  
   3. Untuk tipe Custom Content, dapat dibuat menggunakan Rich Text Editor Static Text atau menggunakan HTML Code, sehingga dapat melakukan menysipkan iframe (seperti Youtube Video atau Social Media Posting), menyisipkan Gambar, Dokumen (PDF, Word, Excel & PPT) dan Hyperlink.  
   4. Untuk tipe Embed hanya dapat menyisipkan URL yang dapat diembed dari Microsoft PowerBI, Tableau dan Google Data Studio.  
   5. Khusus untuk tipe Embed, URL yang digunakan akan di Encrypt dan Decrypt, serta menggunakan UUID untuk menjaga keaman agar URL asli tidak dapat di ambil atau copy oleh User yang tidak bertanggung jawab, sehingga ketika di cek melalui Browser Developer atau Inspect maka tidak ada keluar informasi alamat URL yang asli atau alamat URL yang sebenarnya.  
   6. Setiap Content yang dibuat harus menentukan Menu yang telah dibuat agar dapat diakses oleh pengguna user lainnya.  
   7. Jika menu ada 3 level seperti Root 1A → Child 1A → Child 2A, maka Content yang dibuat hanya dapat memilih menu Child 2A, jika menu ada 2 Level seperti Root 1B → Child 1B, maka Content yang dibuat hanya dapat memilih menu 1B, dan seterusnya.  
   8. Setiap Content yang dibuat ketika di bypass tanpa login, maka pengguna tersebut tidak dapat mengaksesnya.  
6. Email Template Management.  
   1. Email Template hanya ada 4 Tipe sesuai dengan fungsi pada sistem yaitu Invitation Template, Reset Password Template, Suspend Template dan Announcement Template.  
   2. Yang dapat Create, Edit dan Delete Email Template hanya System Administrator dan Administrator.  
   3. Email Template dengan Tipe Invitation Template, Reset Password dan Suspend Template hanya dapat menggunakan masing-masing 1 Template saja dan tidak dapat di Hapus karena sudah bawaan default untuk Sistem.  
   4. Email Template dengan Tipe Announcement hanya dapat mengirimkan ke Semua pengguna yang terdaftar (kecuali User dengan status Suspend).  
   5. Email Template ini dapat di Custom menggunakan HTML Code dan Dynamic Value (Username, Useremail dan Data Value lainnya yang tersedia sesuai dengan Tabel beserta field table yang ada.  
7. Notification System Management.  
   1. Notification System ini bersifat hanya informasi otomatis dari aktivitas pengguna atau Sistem Notifikasi yang dikirimkan manual dari System Administrator dan Administrator.  
   2. Yang dapat Create, Delete dan Send Informasi atau Announcement Notification hanya System Administrator dan Administrator, selebihnya otomatis berdasarkan aktivitas dari pengguna masing-masing.  
   3. Notifikasi ini seperti Lonceng Bell yang menginformasikan informasi dari Sistem Web Aplikasi seperti Welcome Notification, Update Photo Profile, Perubahan password, Perubahan dari System Administrator atau Administrator, Announcement Penambahan atau perubahan Content berdasarkan Role dan Informasi penting yang dikirimkan oleh System Administrator atau Administrator.  
   4. Notifikasi Announcement dapat dibuat menggunakan Rich Text Editor sehingga notifikasi dapat di Custom menggunakan Static Text atau HTML.  
   5. Notifikasi yang didapat user hanya Judulnya saja, jika diklik maka akan diarahkan atau Redirect ke Halaman Detil informasi Notifikasi secara lengkap.  
8. Terms and Condition Management.  
   1. Term and Condition ini dapat di Custom dengan menggunakan Rich Text Editor oleh System Administrator dan Administrator.  
   2. Setiap User yang berhasil Login akan keluar Pop-up Dialog Card atau Modal Dialog Card untuk menyetujui Term and Condition yang berlaku, Jika User tidak menyetujui maka User akan di Logout paksa.  
   3. Pop-up Dialog Card atau Modal Dialog Card Term and Condition ini tidak dapat di Close oleh user sampai User menyetujui atau tidak setuju, Jika User menyetujuinya maka User dapat menikmati Content yang tersedia sesuai dengan Rolesnya, Jika User tidak menyetujuinya maka User akan di Logout secara paksa.  
9. Home Page atau Welcome Page Management.  
   1. Home Page atau Welcome Page merupakan halaman default ketika user berhasil login dan menyetujui Term and Condition, maka halaman ini secara default akan ter-akses, jadi halaman ini merupakan halaman yang dapat diakses oleh semua Users active dan semua Roles.  
   2. Home Page atau Welcome Page berisikan informasi:  
      1. Smooth Marquee Text, Informasi text yang berjalan.  
      2. Image Banner dengan Static Text dan Auto Slideshow.  
      3. Widget Card, Digital Clock dengan Informasi Waktu (Tanggal, Bulan, Tahun, Nama Hari Jam:Menit)  yang sync dengan Time Local Users.  
      4. Widget Card, Line Area Charts dengan informasi jumlah User yang berhasil login dalam kurun waktu 15 Hari terakhir berjalan.  
      5. Widget Card, Top 5 Users yang paling banyak melakukan Login dalam 1 bulan.  
      6. Widget Card, Top 5 Users yang sedang online atau Login berdasarkan login time terakhir.  
      7. Widget Card, Top 10 Announcement Notifikasi yang dibuat oleh System Administrator atau Administrator.   
      8. Widget Card, Top 5 Users baru yang telah di undang, sort berdasarkan Users yang paling baru dibuat.  
      9. Widget Card Hyperlink, Top 5 Menu Content yang paling sering di kunjungi berdasarkan masing-masing users.  
   3. Untuk Widget Card menggunakan Layout Grid.  
   4. Semua Content yang muncul pada halaman ini tidak dapat di close (Marquee, Widget Card, Image Banner Text).  
10. User Profile Management.  
    1. User Profile Management merupakan Edit Profile yang dapat dilakukan oleh masing-masing User.  
    2. Setiap User hanya dapat melakukan Perubahan Photo Profile dan Password di halaman Edit Profile.  
    3. Upload Photo profile hanya diperbolehkan ukuran maksimal 2 MB, dengan ukuran 400x400 Pixel, jika User upload Ukuran 600x400 maka User akan diminta untuk Crop Image sebelum di Submit.  
11. User Access.  
    1. User yang mendapatkan Undangan melalui Email dapat mengakses Halaman Login dengan menggunakan Temporary Password.  
    2. Jika User berhasil login dengan menggunakan Temporary Password, maka User akan diarahkan untuk Perubahan Password terlebih dahulu baru dapat melanjutkan ke Halaman berikutnya.  
    3. Pada halaman Login, User dapat melakukan permintaan Lupa Password, yang nantinya akan secara otomatis dikirimkan melalui email yang terdaftar.  
    4. Email Lupa password yang diterima akan ada informasi Button dengan Hyperlink yang akan diarahkan ke Page perubahan Password.  
    5. Button Hyperlink ini bersifat hanya 1x Click jika tidak diklik maka Button Hyperlink akan expired 120 Menit dan User harus melakukan permintaan ulang Lupa Password kembali.  
    6. Permintaan lupa password ini hanya dapat dilakukan setiap 30 Detik, Jadi user tidak dapat melakukan Spam Klik permintaan.  
    7. Jika User gagal login sebanyak 30 kali atau ada aktifitas mencurigakan seperti Brute Force Login, maka IP Address User akan ter-blokir dan tidak dapat mengakses kembali Web Aplikasi sampai System Adminitrator dan Administrator me-remove IP secara manual masuk daftar Blacklist.  
12. Security Management.  
    1. System Management, hanya menampilkan IP Address yang terblokir atau terblacklist secara otomatis berdasarkan aktifitas mencurigakan dari percobaan login.  
    2. System Administrator dan Administrator dapat menambahkan secara manual IP Address yang berpotensi melakukan aktifitas mencurigakan untuk pencegahan.  
13. System Configuration Management.  
    1. System Configuration Management berfungsi sebagai master konfigurasi yang dapat melakukan:  
       1. Perubahan Logo pada Navbar Menu.  
       2. Perubahan Logo pada Login Page dan Reset Password Page.  
       3. Pengaturan Informasi Static Text Marquee di Home Page atau Welcome Page.  
       4. Pengaturan Image Banner beserta dengan Textnya.  
       5. Pengaturan Footer.  
       6. Pengaturan dengan menentukan Jumlah Failed Login yang akan memblokir IP secara otomatis.  
    2. Halam ini hanya System Administrator yang dapat akses ke System Configuration Management.  
14. System Function Monitoring.  
    1. System Function monitoring akan menampilkan semua fungsi yang telah di implementasikan, memastikan semua fungsi berjalan normal atau adanya gangguan pada fungsi tersebut.  
    2. Halaman ini hanya System Administrator yang dapat mengaksesnya.

**Kebutuhan Frontend:**

1. Menggunakan Dark Theme, dengan Primary Background Color `#OEOE44`.  
2. Primary Color menggunakan Color `#FF7A00`.  
3. Penggunaan Color lainnya harus menyesuaikan, agar ketika effect Hover menyesuaikan dengan Background Color dan harus terlihat.  
4. Navbar Layout Menu harus dibuat Horizontal jangan dibuat Vertical.  
5. Horizontal Navbar Layout Menu harus Sticky.  
6. Tampilan Content atau Page Layout harus Wide.  
7. Responsif untuk Landscape saja. (Desktop dan Tablet).  
8. Setiap aktifitas user seperti Gagal Login, Berhasil Login, Berhasil Update Profile, Berhasil Update Password dan Aktifitas lainnya harus ada Notifikasi dari sistem.  
9. Notifikasi dapat menggunakan Toast atau Sweet Alert.  
10. Pastikan Konsisten pada semua Page untuk Horizontal Navbar Layout Menu yang tampil, Kecuali halaman Login, Halaman Reset Password dan Halaman Update New Password.  
11. Setiap proses Submit atau berpindah halaman akan keluar Masking Animation Loading Screen sampai proses selesai.  
12. Gunakan Canvas Animation untuk Background Login page dan Resert Password page (Contoh Canvas Animation: `[https://codepen.io/sohrabzia/pen/BaXKYaa](https://codepen.io/sohrabzia/pen/BaXKYaa)`).  
13. Gunakan Icon sets dari Iconify - Material Design Icon: `[https://icon-sets.iconify.design/mdi/](https://icon-sets.iconify.design/mdi/)`  
14. Jika belum ada Image yang di upload untuk Content Image Banner, gunakan secara default dari unsplash random image.  
15. Setiap penggunaan transisi harus Smooth.  
16. Tampilan Frontend tidak boleh lambat, harus cepat terbuka.

**User Activity Process:**

1. **First Login (With Temporary Password):**  
   1. User Melakukan Login menggunakan informasi yang terima melalui email atau Invitation Email yang sebelumnya dibuat oleh System Administrator dan Administrator.  
   2. User Login menggunakan temporary password.  
   3. Jika User gagal login sebanyak 30 kali, maka IP address User akan terblokir atau terblacklist secara otomatis dan user tidak dapat mengakses website sampai IP address di Un-Block oleh System Administrator dan Administrator.  
   4. Jika User berhasil login akan redirect otomatis ke Halaman Update New Password.  
   5. Setelah User berhasil ke Update New Password, akan redirect ke Halaman Home Page atau Welcome Page, yang nantinya akan keluar Pop-up Dialog Card atau Modal Dialog Card untuk menyetujui Term and Condition.  
   6. Jika User tidak menyetui Term and Condition maka akan di paksa untuk Logout kembali ke Halaman Login.  
   7. Jika User menyetujui Term and Condition maka User dapat menikmati Menu dan Content yang tersedia berdasarkan Rolesnya.  
2. **For the second login and beyond (After Update New Password):**  
   1. User melakukan login menggunakan Password yang telah diperbaharui (bukan Temporary Password).  
   2. Jika User gagal login sebanyak 30 kali, maka IP address User akan terblokir atau terblacklist secara otomatis dan user tidak dapat mengakses website sampai IP address di Un-Block oleh System Administrator dan Administrator.  
   3. Jika User lupa password, User dapat klik fitur `Lupa Password` yang nantinya akan diarahkan ke Halaman Lupa Password.  
   4. Di halaman lupa password, User klik Button permintaan Lupa password, ketika di Klik akan muncul countdown 30 Detik pada Button untuk melakukan permintaan Lupa password kembali.  
   5. Ketika User meng-klik Button Lupa Password, User akan mendapatkan informasi melalui email berupa Button dengan Hyperlink yang hanya dapat digunakan 1 kali.  
   6. Setelah Klik Button dengan Hyperlink dari permintaan lupa password, User akan diarahkan ke Page Khusus untuk pembaharuan password baru.  
   7. Setelah User berhasil ke Update New Password, akan redirect ke Halaman Home Page atau Welcome Page, yang nantinya akan keluar Pop-up Dialog Card atau Modal Dialog Card untuk menyetujui Term and Condition.  
   8. Jika User tidak menyetui Term and Condition maka akan di paksa untuk Logout kembali ke Halaman Login.  
   9. Jika User menyetujui Term and Condition maka User dapat menikmati Menu dan Content yang tersedia berdasarkan Rolesnya.  
3. **User With Role System Administrator and Administrator:**  
   1. User dengan Role ini setelah melewati proses Login sesuai poin nomor 2, maka akan Muncul semua menu management secara default diantaranya:  
      1. Home atau Welcome Page  
      2. System Management  
         1. Permission Management  
         2. Roles Management  
            1. List All Roles  
            2. Create Roles  
         3. User Management  
            1. List All User  
            2. Create User  
         4. Menu Management  
            1. List All Menu  
            2. Create Menu  
         5. Content Management  
            1. List All Content  
            2. Create Content  
         6. Email Template Management  
            1. List All Template  
            2. Create Announcement Email  
         7. Notification Management  
            1. List All Notification  
            2. Create Announcement Notification  
         8. Terms and Condition Management  
         9. Security Management  
            1. List All IP Blacklist  
            2. Add New IP Blacklist  
         10. Apps Configuration Management  
         11. System Function Monitoring  
      3. (Sample) Menu Root 1A  
         1. Child 1A  
            1. Child 2A (Content)  
      4. (Sample) Menu Root 1B  
         1. Child 1B  
            1. Child 2B(Content)  
      5. (Sample) Menu Root 1C  
         1. Child 1C (Content)  
      6. Icon Bell Notifications  
         1. Notification List  
      7. Image Profile  
         1. Edit Profile  
         2. Logout  
   2. Sedangkan untuk Roles Administrator atau Roles lainnya dapat akses ke menu System Management beserta turunannya, Jika dari System Administrator meng-allow untuk Roles tersebut akses kedalam menu tersebut.  
4. **Standart User (Non System Administrator)**  
   1. Setelah melalui Proses pada Poin nomor 1 atau Poin nomor 2, maka User dapat mengakses secara default untuk Home atau Welcome page.  
   2. Akses ke beberapa Menu sesuai dengan Roles yang sudah di allow oleh System Administrator atau Administrator.  
   3. Contoh:  
      1. (Sample) Menu Root 1A  
         1. Child 1A  
            1. Child 2A (Content)  
      2. (Sample) Menu Root 1B  
         1. Child 1B  
            1. Child 2B(Content)  
      3. (Sample) Menu Root 1C  
         1. Child 1C (Content)  
      4. Icon Bell Notifications  
         1. Notification List  
      5. Image Profile  
         1. Edit Profile  
         2. Logout  
5. **Forgot Password Flow Process**  
   1. User klik tombol "Lupa Password" pada halaman Login.  
   2. Sistem akan menampilkan halaman form isian email yang terdaftar.  
   3. Setelah email di-submit:  
      1. Sistem akan generate UUID-based Token yang hanya berlaku 120 menit.  
      2. Token akan disimpan dalam tabel idbi_password_resets.  
      3. Email akan dikirim ke user yang berisi tombol/hyperlink untuk membuka halaman “Update New Password”.  
   4. Halaman “Update New Password” hanya bisa diakses satu kali dan hanya jika token valid.  
   5. Jika token expired atau sudah digunakan, sistem akan menampilkan pesan “Token tidak valid atau sudah digunakan”.  
   6. Jika berhasil:  
      1. User diminta mengisi password baru dan konfirmasi password.  
      2. Password lama akan diganti dengan yang baru (hashed).  
      3. Token akan otomatis dihapus dari database.  
      4. Redirect ke halaman login.  
   7. Semua request lupa password dibatasi: user hanya bisa mengirim ulang permintaan setelah 30 detik (anti-spam).  
6. **Content Lifecycle Flow**  
   1. Hanya System Administrator dan Administrator yang dapat mengakses halaman "Content Management".  
   2. User memilih tipe konten:  
      1. Custom (HTML atau Rich Text)  
      2. Embed (Power BI, Tableau, Data Studio)  
   3. Konten dibuat melalui form editor.  
      1. Untuk Embed, URL akan dienkripsi sebelum disimpan (Tabel Database Kolom A Original URL, Kolom B Encrypt URL).  
   4. Konten dikaitkan ke salah satu menu yang paling bawah (Child terakhir).  
   5. Setiap konten akan memiliki status:  
      1. Draft: belum tampil ke user (internal saja)  
      2. Published: aktif dan bisa diakses oleh user sesuai role-nya  
   6. Admin dapat melakukan:  
      1. Edit konten  
      2. Ubah status (Draft ↔ Published)  
      3. Hapus konten  
   7. Konten tidak akan tampil jika:  
      1. Menu tidak diizinkan untuk role user  
      2. Status konten masih Draft  
   8. Untuk embed iframe, sistem melakukan:  
      1. Decrypt URL saat render halaman (tanpa mengekspos URL asli ke browser)  
      2. Hanya render jika user memiliki role yang diperbolehkan  
      3. Prevent copy/inspect via masking/obfuscation  
7. **Terms and Conditions Flow (T&C Enforcement)**  
   1. Setelah berhasil login dan redirect ke Home Page, sistem akan mengecek status “T&C Approval” user.  
   2. Jika belum menyetujui:  
      1. Sistem akan menampilkan Modal Dialog Card (tidak bisa di-close).  
      2. User hanya punya dua pilihan: “Setuju” atau “Tidak Setuju”.  
   3. Jika memilih “Tidak Setuju”:  
      1. Sistem akan logout paksa user dan kembali ke halaman login.  
   4. Jika memilih “Setuju”:  
      1. Sistem akan menyimpan status persetujuan di database (tabel idbi_users.tc_accepted_at).  
      2. User akan dialihkan ke halaman utama dan dapat menggunakan aplikasi.  
   5. Approval hanya dilakukan sekali saat login pertama kali setelah update password.  
   6. Jika T&C diperbarui oleh Admin:  
      1. Semua user akan dianggap “belum menyetujui versi baru” → sistem paksa mereka menyetujui ulang setelah login.  
8. **Use Case — Admin Invite New User**  
   1. System Administrator atau Administrator mengakses menu “User Management”.  
   2. Klik tombol “Create New User”.  
   3. Isi:  
      1. Nama  
      2. Email  
      3. Role  
      4. Pilih avatar default atau upload gambar (validasi max 2MB, 400x400 px)  
   4. Klik submit:  
      1. Sistem akan generate temporary password (8 karakter acak)  
      2. Kirim email undangan yang berisi:  
         1. Link halaman login  
         2. Email login  
         3. Temporary password  
   5. User akan:  
      1. Login pertama kali → redirect ke halaman ubah password  
      2. Jika berhasil → muncul modal persetujuan T&C  
      3. Setelah menyetujui → masuk ke dashboard

**Simple Flowchart:**

1. Flowchart: First Login dengan Temporary Password  
   ```  
   [Start]  
      ↓  
   [Akses halaman login]  
      ↓  
   [Input email + temp password]  
      ↓  
   [Validasi credentials]  
      ↓  
   ┌───────────────┐    ┌────────────────────┐  
   │Valid          │    │Invalid (x30 attempt│  
   │credentials    │    │= IP Blacklist)     │  
   └──────┬────────┘    └────────────────────┘  
          ↓  
   [Redirect ke halaman Update Password]  
          ↓  
   [Input password baru + konfirmasi]  
          ↓  
   [Validasi password baru]  
          ↓  
   [Simpan password → Redirect ke Home Page]  
          ↓  
   [Cek apakah T&C sudah disetujui?]  
          ↓  
   ┌─────────────┐      ┌────────────────┐  
   │Belum Setuju │      │Sudah Setuju    │  
   └──────┬──────┘      └────┬───────────┘  
          ↓                  ↓  
   [Tampilkan Modal T&C]     [Masuk ke halaman Home]  
          ↓  
   [User klik "Setuju"?]  
          ↓  
   ┌─────────────┐      ┌────────────┐  
   │Ya (Setuju)  │      │Tidak       │  
   └────┬────────┘      └────┬───────┘  
        ↓                        ↓  
   [Update status T&C]       [Logout paksa]  
        ↓  
   [Masuk ke halaman Home]  
     
   ```  
2. Flowchart: Forgot Password Flow  
   ```  
   [Start]  
      ↓  
   [Klik "Lupa Password" di halaman login]  
      ↓  
   [Input email yang terdaftar]  
      ↓  
   [Generate Token + Simpan ke DB (valid 120 menit)]  
      ↓  
   [Kirim email ke user (link 1x pakai)]  
      ↓  
   [User klik link dari email]  
      ↓  
   [Validasi Token]  
      ↓  
   ┌──────────────┐   ┌─────────────────────────┐  
   │Token Valid   │   │Token Expired/Invalid    │  
   └──────┬───────┘   └──────────┬──────────────┘  
          ↓                     ↓  
   [Redirect ke halaman Update New Password]   [Tampilkan error + redirect login]  
          ↓  
   [Input password baru + konfirmasi]  
          ↓  
   [Validasi → Simpan ke DB (hashed)]  
          ↓  
   [Delete Token → Redirect ke Login]  
   ```  
3. State Machine: Terms & Conditions (T&C)  
   ```  
   [STATE: T&C Belum Disetujui]  
      ├── On Event: Login Berhasil  
      │     └── Action: Tampilkan Modal T&C  
      ├── On Event: Klik "Tidak Setuju"  
      │     └── Transition: Logout Paksa → Kembali ke Login  
      ├── On Event: Klik "Setuju"  
      │     └── Action: Simpan status setuju ke DB  
      │     └── Transition: Tampilkan Home Page  
     
   [STATE: T&C Sudah Disetujui]  
      └── On Event: Login Berikutnya  
            └── Transition: Langsung ke Home Page tanpa modal  
     
   [STATE: T&C Diperbarui oleh Admin]  
      └── All User status reset → kembali ke STATE: T&C Belum Disetujui  
   ```

**Database Usage:**

1. Database akan menggunakan PostgreSQL yang sudah Ready secara online.  
2. Setiap pembuatan Tabel harus menggunakan prefix `idbi_`  
3. Setiap tabel yang dibuat pastikan membuat data Seednya.  
4. Jika ingin menampilkan informasi data Top 5 atau Top 10 atau sejenisnya, sebaiknya menyarankan membuat View atau Store Procedure terlebih dahulu menyesuaikan Informasi yang akan dimuat nantinya agar tidak terlalu banyak query processing didalam Web Applikasi.

## **Rekomendasi Daftar Tabel Database (Prefix: `idbi_`)**

### **Authentication & User Access**

| Tabel | Keterangan |
| ----- | ----- |
| `idbi_users` | Data utama pengguna |
| `idbi_roles` | Role / jabatan pengguna |
| `idbi_permissions` | Hak akses spesifik (Create, Edit, View, Delete) |
| `idbi_role_has_permissions` | Pivot: Role ↔ Permission |
| `idbi_user_has_roles` | Pivot: User ↔ Role |
| `idbi_password_resets` | Token reset password (valid 1x pakai / 120 menit) |
| `idbi_user_tcs` | Status persetujuan T&C per user (versi, waktu) |
| `idbi_user_logs` | Catatan login/logout, IP, browser, dsb. |

---

### **Menu & Navigasi**

| Tabel | Keterangan |
| ----- | ----- |
| `idbi_menus` | Struktur menu 3 level (root → child1 → child2) |
| `idbi_menu_role_access` | Menu mana yang boleh diakses per role |

---

### **Content Management**

| Tabel | Keterangan |
| ----- | ----- |
| `idbi_contents` | Data konten: jenis (custom/embed), status, dll. |
| `idbi_content_menu_map` | Pivot konten ke menu tertentu (child paling bawah) |

---

### **Email Template**

| Tabel | Keterangan |
| ----- | ----- |
| `idbi_email_templates` | Template email HTML (invitation, reset, dsb.) |

---

### **Notification System**

| Tabel | Keterangan |
| ----- | ----- |
| `idbi_notifications` | Isi notifikasi sistem |
| `idbi_notification_user_read` | Pivot untuk menandai notifikasi yang sudah dibaca |

---

### **System & Security**

| Tabel | Keterangan |
| ----- | ----- |
| `idbi_ip_blacklist` | Daftar IP yang diblokir |
| `idbi_system_configs` | Logo, banner, marquee, setting sistem lainnya |
| `idbi_function_logs` | Monitoring status fungsi aplikasi |

---

### **Home Page Widget (Tracking)**

| Tabel | Keterangan |
| ----- | ----- |
| `idbi_user_login_activities` | Tracking login user (untuk chart 15 hari, Top 5 login) |
| `idbi_user_online_status` | Status online user realtime (untuk widget online user) |
| `idbi_content_visit_logs` | Log kunjungan user ke konten/menu (untuk Top 5 visit) |

---

### **Media / File Upload**

| Tabel | Keterangan |
| ----- | ----- |
| `idbi_user_avatars` | Gambar profil user (jika tidak upload custom) |
| `idbi_content_attachments` | Gambar, dokumen, atau media yang disisipkan di konten |
