/**
 * مكتبة التمارين المركزية (Exercise Library)
 * كل تمرين له: قسم داخل الوحدة العلاجية، جرعة افتراضية، وأعلام أمان:
 *  - impact: تمرين عالي الصدمات (قفز/جري/تغيير اتجاه) → يتم تعليمه في الإشارة الصفراء
 *  - heavy:  تحميل ثقيل → يتم قفله في الإشارة الحمراء (لتفادي التثبيط العضلي المفصلي AMI)
 *  - iso:    تمرين ثابت (Isometric) آمن للمرحلة الحادة
 */

export const SECTIONS = {
  warmup: { label: 'الإحماء', en: 'Warm-up', color: 'amber', order: 1 },
  mobility: { label: 'المدى الحركي والمرونة', en: 'Mobility & ROM', color: 'sky', order: 2 },
  neural: { label: 'الانزلاق العصبي والتحكم الحركي', en: 'Neural & Motor Control', color: 'violet', order: 3 },
  strength: { label: 'التقوية والتحميل', en: 'Strengthening', color: 'emerald', order: 4 },
  proprio: { label: 'التوازن والإحساس العميق', en: 'Proprioception', color: 'teal', order: 5 },
  conditioning: { label: 'اللياقة والعودة للرياضة', en: 'Conditioning & RTS', color: 'rose', order: 6 },
  hydro: { label: 'العلاج المائي', en: 'Hydrotherapy', color: 'cyan', order: 7 },
  recovery: { label: 'الاستشفاء والتصريف', en: 'Recovery & Drainage', color: 'indigo', order: 8 },
};

const e = (id, name, en, section, sets, reps, load = 'وزن الجسم', opts = {}) => ({
  id,
  name,
  en,
  section,
  sets,
  reps,
  load,
  rest: opts.rest ?? (section === 'strength' ? '60-90ث' : '30ث'),
  impact: !!opts.impact,
  heavy: !!opts.heavy,
  iso: !!opts.iso,
  cue: opts.cue || '',
});

const LIST = [
  // ───────── Warm-up ─────────
  e('bike_easy', 'دراجة ثابتة بدون مقاومة', 'Stationary Bike (no resistance)', 'warmup', 1, '8-10 د', 'بدون مقاومة', { cue: 'نصف دورة للأمام والخلف إذا لم يكتمل الثني' }),
  e('bike_mod', 'دراجة ثابتة بمقاومة متوسطة', 'Stationary Bike (moderate)', 'warmup', 1, '10-15 د', 'مقاومة 4-6/10'),
  e('upper_ergo', 'جهاز دراجة الذراعين', 'Upper Body Ergometer', 'warmup', 1, '6-8 د', 'خفيف'),
  e('walk_tread', 'مشي على السير المتحرك', 'Treadmill Walking', 'warmup', 1, '10 د', 'سرعة مريحة'),
  e('pendulum', 'تمارين البندول للكتف', 'Codman Pendulum', 'warmup', 2, '30ث كل اتجاه', 'بدون وزن', { iso: true }),
  e('cat_camel', 'تمرين القطة والجمل', 'Cat-Camel', 'warmup', 2, '10', 'وزن الجسم', { cue: 'حركة ضمن مدى خالٍ من الألم' }),
  e('dyn_warmup', 'إحماء ديناميكي شامل', 'Dynamic Warm-up Drills', 'warmup', 1, '10 د', 'وزن الجسم', { impact: true }),
  e('ankle_circles', 'دوائر الكاحل والأبجدية', 'Ankle Alphabet', 'warmup', 2, 'حروف A-Z', 'بدون وزن'),
  e('wrist_warm', 'إحماء الرسغ والأصابع', 'Wrist & Finger Warm-up', 'warmup', 2, '15', 'بدون وزن'),
  e('neck_warm', 'تحريك الرقبة الإيقاعي اللطيف', 'Gentle Neck Rhythmic Movements', 'warmup', 2, '10', 'بدون وزن'),

  // ───────── Mobility ─────────
  e('heel_slides', 'سحب الكعب (ثني الركبة)', 'Heel Slides', 'mobility', 3, '15', 'بدون وزن', { cue: 'التزم بحدود الثني المسموحة للمرحلة' }),
  e('prone_hang', 'تعليق الساق منبطحاً للفرد الكامل', 'Prone Hangs', 'mobility', 3, '3-5 د', 'وزن الكاحل 0.5-1كجم'),
  e('heel_prop', 'سند الكعب لفرد الركبة', 'Heel Props (Extension)', 'mobility', 4, '5 د', 'بدون وزن'),
  e('patella_mob', 'تحريك صابونة الركبة', 'Patellar Mobilization', 'mobility', 3, '30ث كل اتجاه', 'يدوي'),
  e('wall_slides_knee', 'انزلاق القدم على الحائط', 'Wall Slides (Knee Flexion)', 'mobility', 3, '10', 'بدون وزن'),
  e('ham_stretch_gentle', 'إطالة الخلفية اللطيفة بالحزام', 'Gentle Hamstring Strap Stretch', 'mobility', 3, '30ث', 'حزام', { cue: 'بدون ألم - شد خفيف فقط' }),
  e('quad_stretch', 'إطالة العضلة الأمامية', 'Quadriceps Stretch', 'mobility', 3, '30ث', 'وزن الجسم'),
  e('calf_stretch', 'إطالة السمانة على الحائط', 'Gastrocnemius Wall Stretch', 'mobility', 3, '30ث', 'وزن الجسم'),
  e('soleus_stretch', 'إطالة النعلية (ركبة مثنية)', 'Soleus Stretch', 'mobility', 3, '30ث', 'وزن الجسم'),
  e('ankle_df_knee_wall', 'ثني الكاحل الظهري (الركبة للحائط)', 'Knee-to-Wall Dorsiflexion', 'mobility', 3, '12', 'وزن الجسم'),
  e('towel_stretch_ankle', 'إطالة الكاحل بالمنشفة', 'Towel Calf Stretch', 'mobility', 3, '30ث', 'منشفة'),
  e('adductor_stretch', 'إطالة الضامة (وضع الفراشة)', 'Adductor Butterfly Stretch', 'mobility', 3, '30ث', 'وزن الجسم'),
  e('hip_flexor_stretch', 'إطالة ثانيات الفخذ', 'Hip Flexor Stretch (half-kneel)', 'mobility', 3, '30ث', 'وزن الجسم'),
  e('aaprom_shoulder', 'رفع الكتف بمساعدة العصا', 'Wand AAROM Flexion', 'mobility', 3, '10', 'عصا'),
  e('er_wand', 'تدوير خارجي بالعصا (ضمن الحدود)', 'Wand External Rotation', 'mobility', 3, '10', 'عصا', { cue: 'لا تتجاوز 30° في الخلع الأمامي - المرحلة 1' }),
  e('table_slide', 'انزلاق اليد على الطاولة', 'Table Slides', 'mobility', 3, '10', 'منشفة'),
  e('sleeper_stretch', 'إطالة النائم للكبسولة الخلفية', 'Sleeper Stretch', 'mobility', 3, '30ث', 'وزن الجسم'),
  e('pec_stretch', 'إطالة الصدر في الإطار', 'Doorway Pec Stretch', 'mobility', 3, '30ث', 'وزن الجسم'),
  e('wrist_ext_stretch', 'إطالة باسطات الرسغ', 'Wrist Extensor Stretch', 'mobility', 3, '30ث', 'يدوي'),
  e('wrist_flex_stretch', 'إطالة قابضات الرسغ', 'Wrist Flexor Stretch', 'mobility', 3, '30ث', 'يدوي'),
  e('tendon_glides', 'انزلاق أوتار الأصابع', 'Tendon Gliding', 'mobility', 3, '10', 'بدون وزن'),
  e('mckenzie_ext', 'تمارين الفرد لماكنزي (منبطح)', 'McKenzie Prone Press-ups', 'mobility', 3, '10', 'وزن الجسم', { cue: 'أوقف التمرين إذا انتشر الألم أبعد في الساق (Peripheralization)' }),
  e('prone_lying', 'الاستلقاء على البطن (تمركز الألم)', 'Prone Lying', 'mobility', 2, '3 د', 'وزن الجسم'),
  e('knee_to_chest', 'ضم الركبة للصدر', 'Single Knee-to-Chest', 'mobility', 3, '20ث', 'وزن الجسم'),
  e('lumbar_rot', 'دوران أسفل الظهر استلقاءً', 'Supine Lumbar Rotation', 'mobility', 3, '10', 'وزن الجسم'),
  e('chin_tuck', 'سحب الذقن للخلف', 'Chin Tucks', 'mobility', 3, '10×5ث', 'وزن الجسم', { iso: true }),
  e('cerv_rot_arom', 'دوران الرقبة النشط', 'Cervical AROM', 'mobility', 3, '10', 'بدون وزن'),
  e('thoracic_ext', 'فرد الفقرات الصدرية على الأسطوانة', 'Thoracic Extension on Roller', 'mobility', 3, '10', 'أسطوانة'),
  e('scap_retraction', 'ضم لوحي الكتف', 'Scapular Retraction', 'mobility', 3, '15', 'بدون وزن'),
  e('elbow_arom', 'ثني وفرد الكوع النشط', 'Elbow AROM', 'mobility', 3, '15', 'بدون وزن'),
  e('foam_roll', 'التدليك الذاتي بالأسطوانة', 'Foam Rolling', 'mobility', 1, '5 د', 'أسطوانة'),

  // ───────── Neural ─────────
  e('sciatic_slider', 'انزلاق العصب الوركي (Slider)', 'Sciatic Nerve Slider', 'neural', 3, '10', 'بدون وزن', { cue: 'انزلاق وليس شد - لا يجب أن يزيد التنميل' }),
  e('sciatic_tensioner', 'شد العصب الوركي (Tensioner)', 'Sciatic Nerve Tensioner', 'neural', 2, '8', 'بدون وزن', { heavy: true, cue: 'فقط عند استقرار الأعراض العصبية' }),
  e('median_slider', 'انزلاق العصب الأوسط', 'Median Nerve Slider', 'neural', 3, '10', 'بدون وزن'),
  e('ulnar_slider', 'انزلاق العصب الزندي', 'Ulnar Nerve Slider', 'neural', 3, '10', 'بدون وزن'),
  e('radial_slider', 'انزلاق العصب الكعبري', 'Radial Nerve Slider', 'neural', 3, '10', 'بدون وزن'),
  e('peroneal_slider', 'انزلاق العصب الشظوي', 'Peroneal Nerve Slider', 'neural', 3, '10', 'بدون وزن'),
  e('ta_activation', 'تفعيل العضلة البطنية المستعرضة', 'Transversus Abdominis Activation', 'neural', 3, '10×10ث', 'وزن الجسم', { iso: true }),
  e('diaphragm_breath', 'تنفس حجابي', 'Diaphragmatic Breathing', 'neural', 2, '10 أنفاس', 'بدون وزن', { iso: true }),
  e('deep_neck_flex', 'تفعيل قابضات الرقبة العميقة', 'Deep Neck Flexor Activation', 'neural', 3, '10×10ث', 'وزن الجسم', { iso: true }),
  e('nmes_quad', 'تنبيه كهربائي عصبي عضلي للفخذ', 'NMES Quadriceps', 'neural', 1, '15 د', 'شدة تحمل قصوى', { iso: true }),
  e('nmes_ta', 'تنبيه كهربائي للعضلة الظنبوبية الأمامية', 'NMES Tibialis Anterior', 'neural', 1, '15 د', 'شدة تحمل', { iso: true }),
  e('mirror_drill', 'تدريب المرآة/التصور الحركي', 'Mirror / Motor Imagery', 'neural', 1, '5 د', 'بدون وزن'),

  // ───────── Strength ─────────
  e('quad_sets', 'شد عضلة الفخذ الأمامية', 'Quad Sets', 'strength', 3, '10×10ث', 'وزن الجسم', { iso: true }),
  e('slr', 'رفع الساق مفرودة', 'Straight Leg Raise', 'strength', 3, '12', 'وزن الجسم', { cue: 'بدون تأخر في فرد الركبة (Lag)' }),
  e('slr_abd', 'رفع الساق جانباً', 'Side-lying Hip Abduction', 'strength', 3, '12', 'وزن الجسم'),
  e('glute_sets', 'شد عضلات المقعدة', 'Glute Sets', 'strength', 3, '10×5ث', 'وزن الجسم', { iso: true }),
  e('bridge', 'الجسر الأرضي', 'Glute Bridge', 'strength', 3, '12', 'وزن الجسم'),
  e('sl_bridge', 'الجسر على رجل واحدة', 'Single-leg Bridge', 'strength', 3, '10', 'وزن الجسم'),
  e('clamshell', 'تمرين الصدفة', 'Clamshells', 'strength', 3, '15', 'رباط مقاومة خفيف'),
  e('mini_squat', 'قرفصاء جزئي (0-45°)', 'Mini Squat 0-45°', 'strength', 3, '12', 'وزن الجسم'),
  e('wall_sit', 'الجلوس على الحائط', 'Wall Sit', 'strength', 3, '30-45ث', 'وزن الجسم', { iso: true }),
  e('leg_press', 'ضغط الأرجل', 'Leg Press', 'strength', 4, '8-10', '70-80% 1RM', { heavy: true, rest: '2 د' }),
  e('leg_press_light', 'ضغط الأرجل الخفيف (0-60°)', 'Leg Press Light (0-60°)', 'strength', 3, '15', '30-40% 1RM'),
  e('goblet_squat', 'قرفصاء جوبلت', 'Goblet Squat', 'strength', 3, '10', 'دمبل 8-16كجم', { heavy: true }),
  e('back_squat', 'القرفصاء الخلفي بالبار', 'Back Squat', 'strength', 4, '6', '75-85% 1RM', { heavy: true, rest: '2-3 د' }),
  e('split_squat', 'القرفصاء المنفصل', 'Split Squat', 'strength', 3, '10 كل رجل', 'دمبل', { heavy: true }),
  e('bulgarian_ss', 'القرفصاء البلغاري', 'Bulgarian Split Squat', 'strength', 3, '8 كل رجل', 'دمبل', { heavy: true }),
  e('step_up', 'الصعود على الصندوق', 'Step-ups', 'strength', 3, '12', 'وزن الجسم/دمبل'),
  e('step_down', 'النزول الأمامي من الصندوق', 'Forward Step-downs', 'strength', 3, '10', 'وزن الجسم'),
  e('lunge', 'الطعن الأمامي', 'Forward Lunge', 'strength', 3, '10 كل رجل', 'وزن الجسم/دمبل', { heavy: true }),
  e('leg_ext_90_45', 'فرد الركبة بالجهاز (90-45°)', 'Knee Extension 90-45°', 'strength', 3, '12', 'خفيف-متوسط', { heavy: true }),
  e('spanish_squat', 'القرفصاء الإسباني (ثابت)', 'Spanish Squat Isometric', 'strength', 5, '45ث', 'رباط ثقيل', { iso: true, cue: 'مسكن لألم وتر الرضفة' }),
  e('decline_squat', 'القرفصاء على منحدر', 'Decline Squat', 'strength', 3, '15', 'وزن الجسم/حقيبة', { heavy: true }),
  e('leg_ext_iso', 'فرد الركبة الثابت (60°)', 'Isometric Knee Extension 60°', 'strength', 5, '45ث', '70% MVC', { iso: true }),
  e('ham_iso', 'انقباض ثابت للخلفية (ركبة 90°)', 'Isometric Hamstring 90°', 'strength', 3, '6×10ث', 'تحت الألم', { iso: true }),
  e('ham_iso_30', 'انقباض ثابت للخلفية (ركبة 30°)', 'Isometric Hamstring 30°', 'strength', 3, '6×10ث', 'متوسط', { iso: true }),
  e('ham_curl_band', 'ثني الركبة بالرباط المطاطي', 'Banded Hamstring Curl', 'strength', 3, '15', 'رباط خفيف'),
  e('ham_bridge_walkout', 'الجسر مع المشي للأمام', 'Bridge Walkouts', 'strength', 3, '8', 'وزن الجسم'),
  e('rdl', 'الرفعة الرومانية', 'Romanian Deadlift', 'strength', 3, '8', 'دمبل/بار', { heavy: true }),
  e('sl_rdl', 'الرفعة الرومانية على رجل واحدة', 'Single-leg RDL', 'strength', 3, '8 كل رجل', 'دمبل', { heavy: true }),
  e('nordic', 'تمرين النوردك', 'Nordic Hamstring Curl', 'strength', 3, '5', 'وزن الجسم', { heavy: true, cue: 'المحرك الأساسي للوقاية من تكرار الإصابة' }),
  e('ham_slider', 'ثني الركبة بالمنزلق', 'Slider Leg Curl', 'strength', 3, '10', 'وزن الجسم', { heavy: true }),
  e('copenhagen_short', 'كوبنهاجن (رافعة قصيرة)', 'Copenhagen Short Lever', 'strength', 3, '20ث', 'وزن الجسم', { iso: true }),
  e('copenhagen_long', 'كوبنهاجن (رافعة طويلة)', 'Copenhagen Long Lever', 'strength', 3, '8', 'وزن الجسم', { heavy: true }),
  e('add_squeeze', 'ضغط الكرة بين الركبتين', 'Adductor Ball Squeeze', 'strength', 3, '10×10ث', 'كرة', { iso: true }),
  e('add_band', 'تقريب الفخذ بالرباط', 'Banded Hip Adduction', 'strength', 3, '15', 'رباط متوسط'),
  e('calf_iso', 'انقباض ثابت للسمانة', 'Isometric Calf Hold', 'strength', 5, '45ث', '70% MVC', { iso: true }),
  e('calf_raise_dl', 'رفع الكعبين بالرجلين', 'Double-leg Calf Raise', 'strength', 3, '15', 'وزن الجسم'),
  e('calf_raise_sl', 'رفع الكعب على رجل واحدة', 'Single-leg Calf Raise', 'strength', 3, '15', 'وزن الجسم'),
  e('calf_raise_heavy', 'رفع الكعب الموزون (جهاز سميث)', 'Weighted Calf Raise (Smith)', 'strength', 4, '8', 'ثقيل', { heavy: true, rest: '2 د' }),
  e('seated_calf', 'رفع الكعب جالساً (النعلية)', 'Seated Soleus Raise', 'strength', 3, '15', 'دمبل/جهاز', { heavy: true }),
  e('eccentric_heel', 'النزول اللامركزي للكعب (ألفريدسون)', 'Alfredson Eccentric Heel Drop', 'strength', 3, '15', 'وزن الجسم', { heavy: true }),
  e('theraband_ankle', 'تقوية الكاحل بالرباط (4 اتجاهات)', 'Theraband Ankle 4-way', 'strength', 3, '15', 'رباط مقاومة'),
  e('ankle_iso', 'انقباضات ثابتة للكاحل', 'Ankle Isometrics', 'strength', 3, '10×5ث', 'تحت الألم', { iso: true }),
  e('towel_scrunch', 'تجميع المنشفة بالأصابع', 'Towel Scrunches', 'strength', 3, '1 د', 'منشفة'),
  e('ankle_pumps', 'ضخ الكاحل', 'Ankle Pumps', 'strength', 3, '20', 'بدون وزن'),
  e('df_band', 'رفع مشط القدم بالرباط', 'Banded Dorsiflexion', 'strength', 3, '15', 'رباط خفيف'),
  e('heel_walk', 'المشي على الكعبين', 'Heel Walking', 'strength', 3, '20م', 'وزن الجسم'),
  e('shoulder_iso', 'انقباضات ثابتة تحت القصوى للكتف', 'Submax Shoulder Isometrics', 'strength', 3, '10×5ث', '30-50%', { iso: true }),
  e('er_band', 'تدوير خارجي بالرباط', 'Banded External Rotation', 'strength', 3, '15', 'رباط خفيف'),
  e('ir_band', 'تدوير داخلي بالرباط', 'Banded Internal Rotation', 'strength', 3, '15', 'رباط خفيف'),
  e('er_sidelying', 'تدوير خارجي جانبي بالدمبل', 'Side-lying ER', 'strength', 3, '12', 'دمبل 1-2كجم'),
  e('scaption', 'رفع الذراع في مستوى اللوح', 'Scaption', 'strength', 3, '12', 'دمبل 1-3كجم'),
  e('ytw', 'تمارين Y-T-W منبطحاً', 'Prone Y-T-W', 'strength', 3, '8 كل حرف', 'بدون/1كجم'),
  e('row_band', 'سحب أفقي بالرباط', 'Banded Row', 'strength', 3, '15', 'رباط متوسط'),
  e('serratus_punch', 'لكمة السيراتس', 'Serratus Punch', 'strength', 3, '15', 'دمبل خفيف'),
  e('wall_pushup', 'ضغط على الحائط مع Plus', 'Wall Push-up Plus', 'strength', 3, '12', 'وزن الجسم'),
  e('pushup', 'تمرين الضغط', 'Push-up', 'strength', 3, '10', 'وزن الجسم', { heavy: true }),
  e('db_press', 'ضغط الكتف بالدمبل', 'Dumbbell Shoulder Press', 'strength', 3, '10', 'دمبل', { heavy: true }),
  e('bench_press', 'ضغط الصدر بالبار', 'Bench Press', 'strength', 4, '6-8', 'متوسط-ثقيل', { heavy: true }),
  e('lat_pull', 'سحب علوي', 'Lat Pulldown', 'strength', 3, '10', 'متوسط', { heavy: true }),
  e('er_90_90', 'تدوير خارجي 90/90 بالرباط', '90/90 Banded ER', 'strength', 3, '12', 'رباط متوسط'),
  e('wrist_ext_iso', 'انقباض ثابت لباسطات الرسغ', 'Isometric Wrist Extension', 'strength', 5, '45ث', '70% MVC', { iso: true }),
  e('wrist_ext_ecc', 'تمرين لامركزي لباسطات الرسغ', 'Eccentric Wrist Extension', 'strength', 3, '15', 'دمبل 1-3كجم', { heavy: true }),
  e('tyler_twist', 'لفة تايلر العكسية (FlexBar)', 'Tyler Twist (FlexBar)', 'strength', 3, '15', 'FlexBar', { heavy: true }),
  e('grip_putty', 'تقوية القبضة بالصلصال', 'Grip Putty', 'strength', 3, '1 د', 'صلصال علاجي'),
  e('supination_pron', 'كب وبطح الساعد بالمطرقة', 'Hammer Supination/Pronation', 'strength', 3, '12', 'مطرقة خفيفة'),
  e('bicep_curl', 'ثني الكوع بالدمبل', 'Biceps Curl', 'strength', 3, '12', 'دمبل خفيف'),
  e('farmer_carry', 'حمل المزارع', "Farmer's Carry", 'strength', 3, '30م', 'دمبل متوسط-ثقيل', { heavy: true }),
  e('dead_bug', 'تمرين الحشرة الميتة', 'Dead Bug', 'strength', 3, '10', 'وزن الجسم'),
  e('bird_dog', 'تمرين الطائر والكلب', 'Bird Dog', 'strength', 3, '10 كل جهة', 'وزن الجسم'),
  e('plank', 'البلانك الأمامي', 'Front Plank', 'strength', 3, '30-45ث', 'وزن الجسم', { iso: true }),
  e('side_plank', 'البلانك الجانبي', 'Side Plank', 'strength', 3, '20-30ث', 'وزن الجسم', { iso: true }),
  e('pallof', 'ضغط بالوف المضاد للدوران', 'Pallof Press', 'strength', 3, '12', 'رباط/كابل'),
  e('mcgill_curl', 'تمرين ماكجيل للبطن', 'McGill Curl-up', 'strength', 3, '6×10ث', 'وزن الجسم', { iso: true }),
  e('hip_hinge', 'تعلم مفصلة الحوض بالعصا', 'Hip Hinge with Dowel', 'strength', 3, '10', 'عصا'),
  e('deadlift', 'الرفعة الميتة', 'Deadlift (Trap bar)', 'strength', 4, '6', 'متوسط-ثقيل', { heavy: true, rest: '2-3 د' }),
  e('cerv_iso', 'انقباضات ثابتة للرقبة', 'Cervical Isometrics', 'strength', 3, '10×5ث', 'مقاومة يدوية خفيفة', { iso: true }),
  e('shrug_row', 'سحب وضم اللوحين بالرباط', 'Band Pull-aparts', 'strength', 3, '15', 'رباط خفيف'),
  e('hip_thrust', 'دفع الحوض بالبار', 'Barbell Hip Thrust', 'strength', 4, '8', 'متوسط-ثقيل', { heavy: true }),
  e('eversion_band', 'تدوير القدم للخارج بالرباط', 'Banded Eversion', 'strength', 3, '15', 'رباط متوسط'),
  e('tke', 'فرد الركبة النهائي بالرباط', 'Terminal Knee Extension', 'strength', 3, '15', 'رباط متوسط'),

  // ───────── Proprioception ─────────
  e('weight_shift', 'نقل الوزن بين الرجلين', 'Weight Shifting', 'proprio', 3, '1 د', 'وزن الجسم'),
  e('sl_balance', 'الوقوف على رجل واحدة', 'Single-leg Balance', 'proprio', 3, '30ث', 'وزن الجسم'),
  e('sl_balance_foam', 'التوازن على وسادة إسفنجية', 'Single-leg Balance on Foam', 'proprio', 3, '30ث', 'وسادة'),
  e('sl_balance_eyes', 'التوازن بعيون مغلقة', 'Single-leg Balance Eyes Closed', 'proprio', 3, '20ث', 'وزن الجسم'),
  e('bosu_squat', 'القرفصاء على البوسو', 'BOSU Squat', 'proprio', 3, '10', 'بوسو'),
  e('y_balance', 'تمرين التوازن Y', 'Y-Balance Reach', 'proprio', 3, '5 كل اتجاه', 'وزن الجسم'),
  e('star_excursion', 'تمرين النجمة', 'Star Excursion', 'proprio', 2, '1 دورة', 'وزن الجسم'),
  e('ball_toss_sl', 'التوازن مع رمي الكرة', 'Single-leg Ball Toss', 'proprio', 3, '30ث', 'كرة طبية خفيفة'),
  e('perturbation', 'تمارين الاضطراب (Perturbation)', 'Perturbation Training', 'proprio', 3, '45ث', 'يدوي/لوح'),
  e('rhythmic_stab', 'التثبيت الإيقاعي للكتف', 'Rhythmic Stabilization', 'proprio', 3, '30ث', 'يدوي'),
  e('closed_chain_shoulder', 'تحميل مغلق للكتف على الكرة', 'Closed-chain Ball on Wall', 'proprio', 3, '30ث', 'كرة'),
  e('quadruped_shift', 'نقل الوزن على أربع', 'Quadruped Weight Shift', 'proprio', 3, '30ث', 'وزن الجسم'),
  e('gait_training', 'تدريب المشي الطبيعي', 'Gait Re-education', 'proprio', 1, '5 د', 'وزن الجسم', { cue: 'التحكم في مرحلة التحميل وفرد الركبة عند ملامسة الكعب' }),
  e('tandem_walk', 'المشي على خط مستقيم', 'Tandem Walk', 'proprio', 3, '10م', 'وزن الجسم'),

  // ───────── Conditioning / RTS ─────────
  e('jog_tread', 'جري خفيف على السير', 'Treadmill Jogging', 'conditioning', 1, '10-15 د', 'إيقاع خفيف', { impact: true }),
  e('run_progression', 'برنامج العودة للجري (مشي/جري)', 'Walk-Run Progression', 'conditioning', 1, '20 د', 'نسبة 1:1 ثم 1:2', { impact: true }),
  e('tempo_run', 'جري إيقاعي 70%', 'Tempo Runs 70%', 'conditioning', 6, '100م', '70% سرعة قصوى', { impact: true }),
  e('sprint', 'العدو السريع التدريجي', 'Progressive Sprints', 'conditioning', 6, '30-40م', '80-95%', { impact: true, heavy: true }),
  e('agility_ladder', 'سلم الرشاقة', 'Agility Ladder', 'conditioning', 4, '1 دورة', 'وزن الجسم', { impact: true }),
  e('cutting', 'تغيير الاتجاه (Cutting 45°-90°)', 'Cutting Drills', 'conditioning', 4, '6', 'متدرج', { impact: true, heavy: true }),
  e('double_hop', 'القفز بالرجلين في المكان', 'Double-leg Hops', 'conditioning', 3, '10', 'وزن الجسم', { impact: true }),
  e('box_jump', 'القفز على الصندوق', 'Box Jumps', 'conditioning', 3, '6', 'وزن الجسم', { impact: true }),
  e('drop_jump', 'القفز العميق (Drop Jump)', 'Drop Jumps', 'conditioning', 3, '5', 'وزن الجسم', { impact: true, heavy: true }),
  e('sl_hop', 'القفز على رجل واحدة', 'Single-leg Hops', 'conditioning', 3, '8', 'وزن الجسم', { impact: true, heavy: true }),
  e('lateral_bound', 'الوثب الجانبي', 'Lateral Bounds', 'conditioning', 3, '6 كل جهة', 'وزن الجسم', { impact: true }),
  e('pogo', 'قفزات بوجو للكاحل', 'Pogo Hops', 'conditioning', 3, '20', 'وزن الجسم', { impact: true }),
  e('skipping', 'نط الحبل', 'Jump Rope', 'conditioning', 3, '1 د', 'حبل', { impact: true }),
  e('sport_specific', 'تدريبات خاصة بالرياضة', 'Sport-specific Drills', 'conditioning', 1, '20 د', 'متدرج', { impact: true, heavy: true }),
  e('plyo_pushup', 'ضغط بلايومتري على الحائط', 'Plyo Wall Push-up', 'conditioning', 3, '10', 'وزن الجسم', { impact: true }),
  e('med_ball_throw', 'رمي الكرة الطبية للحائط', 'Medicine Ball Throws', 'conditioning', 3, '10', 'كرة 1-3كجم', { impact: true }),
  e('throwing_prog', 'برنامج الرمي التدريجي', 'Interval Throwing Program', 'conditioning', 1, 'حسب المرحلة', 'متدرج', { impact: true, heavy: true }),
  e('elliptical', 'جهاز الإليبتكال', 'Elliptical', 'conditioning', 1, '15-20 د', 'متوسط'),
  e('swim', 'سباحة حرة/ظهر', 'Swimming', 'conditioning', 1, '20 د', 'متوسط'),
  e('return_to_work', 'محاكاة مهام العمل/الحياة اليومية', 'Work Simulation Tasks', 'conditioning', 1, '15 د', 'متدرج'),

  // ───────── Hydrotherapy ─────────
  e('pool_walk', 'المشي في الماء (مستوى الصدر)', 'Pool Walking (chest depth)', 'hydro', 1, '10 د', 'مقاومة الماء'),
  e('pool_rom', 'تمارين المدى الحركي في الماء', 'Aquatic ROM', 'hydro', 2, '10', 'طفو'),
  e('pool_squat', 'القرفصاء في الماء', 'Aquatic Squats', 'hydro', 3, '15', 'مقاومة الماء'),
  e('deep_water_run', 'الجري في المياه العميقة', 'Deep Water Running', 'hydro', 1, '15 د', 'حزام طفو'),
  e('pool_kick', 'الركل بلوح السباحة', 'Kickboard Flutter Kicks', 'hydro', 3, '25م', 'لوح طفو'),
  e('pool_shoulder', 'تمارين الكتف المائية بالعوامات', 'Aquatic Shoulder Drills', 'hydro', 3, '12', 'عوامات'),

  // ───────── Recovery ─────────
  e('cryo', 'تبريد/علاج بالثلج', 'Cryotherapy', 'recovery', 1, '15-20 د', 'كمادة باردة', { iso: true }),
  e('game_ready', 'ضغط وتبريد ديناميكي', 'Cryo-Compression', 'recovery', 1, '20 د', 'جهاز ضغط', { iso: true }),
  e('elevation', 'رفع الطرف فوق مستوى القلب', 'Elevation', 'recovery', 1, '20 د', 'وسائد', { iso: true }),
  e('lymph_drain', 'تصريف لمفاوي يدوي', 'Manual Lymphatic Drainage', 'recovery', 1, '10-15 د', 'يدوي', { iso: true }),
  e('compression', 'رباط ضاغط', 'Compression Wrap', 'recovery', 1, 'طوال اليوم', 'رباط', { iso: true }),
  e('tens', 'تنبيه كهربائي لتسكين الألم (TENS)', 'TENS Pain Modulation', 'recovery', 1, '20 د', 'شدة مريحة', { iso: true }),
  e('soft_tissue', 'تدليك الأنسجة الرخوة', 'Soft Tissue Massage', 'recovery', 1, '10 د', 'يدوي'),
  e('heat_pack', 'كمادة دافئة', 'Moist Heat', 'recovery', 1, '15 د', 'كمادة', { iso: true }),
  e('relax_pos', 'وضعيات الراحة وتخفيف الضغط', 'Positional Relief', 'recovery', 1, '10 د', 'وسائد', { iso: true }),
];

export const EXERCISES = Object.fromEntries(LIST.map((x) => [x.id, x]));
export const EXERCISE_LIST = LIST;

/**
 * تحويل مرجع تمرين داخل البروتوكول إلى كائن كامل
 * المرجع إما نص (id) أو كائن { id, sets, reps, load, ... } لتعديل الجرعة
 */
export function resolveExercise(ref) {
  if (!ref) return null;
  if (typeof ref === 'string') {
    const base = EXERCISES[ref];
    return base ? { ...base } : null;
  }
  if (ref.custom) return { ...ref };
  const base = EXERCISES[ref.id];
  if (!base) return ref.name ? { ...ref } : null;
  return { ...base, ...ref };
}
