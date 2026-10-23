-- ============================================================================
-- TULSI JEWELLERS — seed data (Stage 2)
-- ----------------------------------------------------------------------------
-- Run AFTER schema.sql in the Supabase SQL Editor.
--
-- Rules honoured here:
--   * Categories mirror COLLECTIONS in src/lib/config.ts exactly.
--   * Products are NOT seeded. Only the showroom's own photographed pieces are
--     added, by hand, and nothing appears publicly until status = 'active'.
--   * No prices, no stock, no rates, no reviews, no business facts are invented.
--     metal_rates and reviews are intentionally seeded with ZERO rows.
--   * Every seeded FAQ states only facts already present in config.ts or the
--     project's hard business rules (delivery note, no online payments).
--   * Idempotent: ON CONFLICT DO NOTHING everywhere.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CATEGORIES — same six lines, slugs and wording as src/lib/config.ts
-- ----------------------------------------------------------------------------
insert into public.categories (slug, name_en, name_hi, description_en, description_hi, sort_order, is_active)
values
  ('gold-jewellery',  'Gold Jewellery',      'सोने के गहने',   'Gold jewellery in 24K, 22K and 20K purities.',                          '24K, 22K और 20K शुद्धता में सोने के गहने।',                              10, true),
  ('gold-coins',      'Gold Coins',          'सोने के सिक्के', 'Gold coins for gifting and savings.',                                  'उपहार और बचत के लिए सोने के सिक्के।',                                  20, true),
  ('gold-biscuits',   'Gold Biscuits',       'सोने की बिस्किट','Fine gold 999.9 biscuits as shown on our flyer.',                      'हमारी फ्लायर पर दर्शाया गया फाइन गोल्ड 999.9 बिस्किट।',                  30, true),
  ('silver-jewellery','Silver Jewellery',    'चांदी के गहने',   'Silver jewellery for everyday and occasions.',                         'रोज़ और अवसरों के लिए चांदी के गहने।',                                   40, true),
  ('fancy-jewellery', 'Fancy Jewellery',     'फैंसी ज्वेलरी',  'Artificial / fashion jewellery.',                                      'आर्टिफिशियल / फैशन ज्वेलरी।',                                           50, true),
  ('gems',            'Gems / Ratna Collection', 'रत्न संग्रह', 'Ruby, citrine/topaz, emerald, sapphire, pearl and amethyst.',          'माणिक्य, पुखराज, पन्ना, नीलम, मोती और अमेथिस्ट।',                        60, true)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- FAQs — only verified facts. Delivery wording is EXACT as mandated.
-- ----------------------------------------------------------------------------
insert into public.faqs (question_en, question_hi, answer_en, answer_hi, category, sort_order, is_active)
select * from (values
  ('Do you deliver outside Nagpur?',
   'क्या आप नागपुर के बाहर डिलीवरी करते हैं?',
   'Home delivery outside Nagpur is currently not available. Please contact Tulsi Jewellers for current service and delivery availability within Nagpur.',
   'नागपुर के बाहर होम डिलीवरी फिलहाल उपलब्ध नहीं है। कृपया मौजूदा सेवा और नागपुर के भीतर डिलीवरी की उपलब्धता के लिए तुलसी ज्वेलर्स से संपर्क करें।',
   'delivery', 10, true),

  ('Do you accept online payments?',
   'क्या आप ऑनलाइन भुगतान स्वीकार करते हैं?',
   'No. Tulsi Jewellers does not offer online payments. The Gold Saving Scheme is enquiry- and visit-based — please contact us or visit the showroom.',
   'नहीं। तुलसी ज्वेलर्स में ऑनलाइन भुगतान की सुविधा नहीं है। गोल्ड सेविंग स्कीम पूछताछ/भेंट आधारित है — कृपया हमसे संपर्क करें या शोरूम पर आएँ।',
   'scheme', 20, true),

  ('How much does the Gold Saving Scheme start from?',
   'गोल्ड सेविंग स्कीम कितने से शुरू होती है?',
   'The Gold Saving Scheme starts from ₹499 with monthly savings. Please contact the showroom for the current scheme terms.',
   'गोल्ड सेविंग स्कीम ₹499 से शुरू होती है और यह मासिक बचत पर आधारित है। मौजूदा स्कीम की शर्तों के लिए कृपया शोरूम से संपर्क करें।',
   'scheme', 30, true),

  ('Are the rates shown on the website final prices?',
   'वेबसाइट पर दिखाए गए रेट अंतिम कीमत हैं क्या?',
   'Rates shown are indicative. Final price depends on the product, making charges and applicable taxes, confirmed at Tulsi Jewellers.',
   'दिखाए गए बुलियन रेट बताए गए स्रोत के इंडिकेटिव बेंचमार्क/बाज़ार रेट हैं और इनमें जीएसटी, मेकिंग चार्जेस, वेस्टेज, स्टोन चार्जेस और अन्य लागू शुल्क शामिल नहीं हो सकते। अंतिम गहनों की कीमत तुलसी ज्वेलर्स की लागू कीमत और उत्पाद विवरण के अधीन है।',
   'rates', 40, true),

  ('Where is Tulsi Jewellers located?',
   'तुलसी ज्वेलर्स कहाँ स्थित है?',
   'Tulsi Jewellers is located in Hansapuri, Nagpur. Please see the Visit Us page for the map and directions.',
   'तुलसी ज्वेलर्स हंसापुरी, नागपुर में स्थित है। मैप और दिशा-निर्देशों के लिए कृपया हमसे मिलें पेज देखें।',
   'visit', 50, true),

  ('Do you have certified gems?',
   'क्या आपके पास प्रमाणित रत्न हैं?',
   'Our gems (ratna) collection includes ruby, citrine/topaz, emerald, sapphire, pearl and amethyst. Please contact the showroom for details of certification for any specific stone.',
   'हमारे रत्न संग्रह में माणिक्य, पुखराज, पन्ना, नीलम, मोती और अमेथिस्ट शामिल हैं। किसी विशेष रत्न के प्रमाणन विवरण के लिए कृपया शोरूम से संपर्क करें।',
   'gems', 60, true
) as seed(question_en, question_hi, answer_en, answer_hi, category, sort_order, is_active)
where not exists (select 1 from public.faqs);

-- ----------------------------------------------------------------------------
-- ANNOUNCEMENT — one factual, evergreen bar message (bilingual, from the
-- owner-supplied tagline). No invented promotions or discounts.
-- ----------------------------------------------------------------------------
insert into public.announcements (message_en, message_hi, is_active, sort_order)
select 'आपका विश्वास, हमारी पहचान', 'आपका विश्वास, हमारी पहचान', true, 10
where not exists (select 1 from public.announcements);

-- ----------------------------------------------------------------------------
-- SCHEME ENQUIRY sanity row? NO — enquiries tables stay empty by design.
-- METAL RATES? ZERO rows — rates are fetched, never invented.
-- REVIEWS? ZERO rows — reviews may only come from genuine, approved feedback.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- After creating your auth user in Dashboard → Authentication → Users,
-- promote it to admin (uncomment and replace the email):
--
-- insert into public.admin_users (user_id, email, role)
-- select id, email, 'owner' from auth.users
-- where email = 'owner@example.com'
-- on conflict (user_id) do nothing;
-- ============================================================================
