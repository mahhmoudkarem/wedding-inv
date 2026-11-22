// =====================================================
//  كل بيانات الدعوة هنا — عدّل من الملف ده بس
// =====================================================
export const WEDDING = {
  groom: { ar: 'عبدالرحمن', en: 'Abdelrahman' },
  bride: { ar: 'منة', en: 'Menna' },

  // ⚠️ غيّر التاريخ والساعة هنا (توقيت القاهرة)  —  YYYY-MM-DDTHH:mm:ss+02:00
  date: '2026-12-20T19:00:00+02:00',
  // مدة الفرح بالساعات (بتستخدم في زرار "أضف للتقويم")
  durationHours: 5,

  venue: {
    name: 'Leciel Wedding Hall',
    address: 'Maadi Island, Corniche El Maadi, Cairo',
    mapsLink: 'https://maps.app.goo.gl/h5BTn1dhSdfH7hhQ9',
    embedQuery: 'قاعه لوسيال جزيره المعادي',
  },

  song: 'song.mp3',
  photo: 'couple.jpg',
  hashtag: '#AbdelrahmanAndMenna',
};
