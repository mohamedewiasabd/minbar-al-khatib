// =====================================================================
// محرك صياغة الخطب المشترك (يُستخدم في الخادم وفي متصفح التطبيق الأصلي)
// =====================================================================
import { Type } from '@google/genai';
import { GenerateRequest, Sermon } from '../types';

// النماذج المدعومة حسب الإصدار الأحدث تلقائياً
export const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
];

export const LENGTH_MAP: Record<string, { desc: string; minutes: number; words: number }> = {
  short: {
    desc: 'خطبة موجزة ومركزة ومحكمة (حوالي 10 دقائق، ما بين 1800 إلى 2200 كلمة - مستهدف تقريباً 2000 كلمة)',
    minutes: 10,
    words: 2000,
  },
  medium: {
    desc: 'خطبة معتدلة نموذجية وشاملة (حوالي 15 - 18 دقيقة، ما بين 2800 إلى 3400 كلمة - مستهدف تقريباً 3000 كلمة)',
    minutes: 16,
    words: 3000,
  },
  long: {
    desc: 'خطبة مفصلة مستفيضة وعميقة (حوالي 20 - 25 دقيقة، ما بين 3800 إلى 4500 كلمة - مستهدف تقريباً 4200 كلمة)',
    minutes: 22,
    words: 4200,
  },
};

export const COMPLEXITY_MAP: Record<string, string> = {
  simple: 'أسلوب السهل الممتنع البليغ: لغة عربية نقية سهلة وميسرة يفهمها العامي وكل من يعرف العربية دون أدنى تعقيد أو حوشي من الألفاظ، وبلاغتها في ذات الوقت تضاهي الفصحى في حسن السبك وجمال الإيقاع وقوة التأثير وهز القلوب.',
  moderate: 'فصيح معاصر متوازن: يجمع بين سهولة الفهم وسلاسة العبارة وعمق المعنى بأسلوب يخاطب كافة أطياف المصلين.',
  eloquent: 'بلاغي راقٍ ومؤثر: فصاحة بديعة متدفقة تلامس القلوب، خالية من التعقيد والتكلف، ذات وقع منبري آسر.',
};

export const TONE_MAP: Record<string, string> = {
  exhortative: 'وعظي ترقيقي: يركز على تليين القلوب، التذكير بالدار الآخرة، محاسبة النفس، التوبة، والخوف والرجاء في الله.',
  guidance: 'توجيهي إصلاحي اجتماعي: يركز على معالجة المشكلات الاجتماعية والسلوكيات المعاصرة وربطها بالهدي النبوي والحلول العملية.',
  foundational: 'علمي تأصيلي: يركز على ترسيخ العقيدة الصحيحة، الاستدلال الدقيق، فقه العبادات أو المعاملات بأسلوب منبري رصين.',
  inspirational: 'حماسي شاحذ للهمم: يبعث في المصلين العزة والأمل، ويحفزهم على البذل والعمل الصالح والتفاؤل ونصرة الحق.',
};

export const DIALECT_MAP: Record<string, { label: string; desc: string; guidance: string }> = {
  msa: {
    label: 'فصحى عصرية (جميع الأقطار)',
    desc: 'العربية الفصحى الواضحة الميسرة التي يفهمها الجميع في كل الأقطار العربية.',
    guidance: 'استخدم لغة عربية فصحى واضحة وميسرة، بأسلوب السهل الممتنع: كلمات مألوفة عند الجميع في العالم العربي، جمل قصيرة ومباشرة، تجنب الألفاظ النادرة أو التراكيب المعقدة. اشرح كل مفهوم للناس العاديين بشكل مباشر ومبسط.'
  },
  egyptian: {
    label: 'مُصَرِّح بالفصحى الميسّرة (مصر)',
    desc: 'الفصحى المحبوبة عند المصريين: جمل قصيرة، تراكيب واضحة، كلمات مفهومة للعموم، مع تجنب أي مصطلحات غير مألوفة.',
    guidance: 'اكتب بفصحى واضحة قريبة من أسلوب المدرسين والدعاة المصريين المحبوبين: جمل قصيرة ومباشرة، شرح المفاهيم بشكل عملي، تجنب التراكيب الطويلة المعقدة، استبدل المعقد بالمعلوم والمبسّط. لا تستخدم ألفاظاً عامية مصرية داخل الخطبة، بل اجعل الفصحى واضحة يفهمها كل مصري.'
  },
  levantine: {
    label: 'فصحى ميسّرة (الشام: سوريا ولبنان والأردن وفلسطين)',
    desc: 'الفصحى الواضحة التي يفهمها أهل الشام: جمل مختصرة، تراكيب مألوفة، كلمات مفهومة للجميع.',
    guidance: 'اكتب بفصحى واضحة قريبة من أسلوب الدعاة والمعلمين الشوام: جمل قصيرة، شرح المفاهيم بشكل مباشر وبسيط، تجنب التراكيب الطويلة والألفاظ النادرة. لا تستخدم ألفاظاً عامية شامية، بل اجعل الفصحى واضحة ومباشرة يفهمها كل شامي.'
  },
  gulf: {
    label: 'فصحى ميسّرة (الخليج العربي)',
    desc: 'الفصحى الواضحة المألوفة عند أهل الخليج: جمل واضحة، تراكيب مفهومة، شرح مباشر.',
    guidance: 'اكتب بفصحى واضحة قريبة من أسلوب الدعاة والعلماء الخليجيين: جمل قصيرة ومباشرة، شرح المفاهيم بشكل عملي، تجنب التراكيب الطويلة والألفاظ النادرة. لا تستخدم ألفاظاً عامية خليجية، بل اجعل الفصحى واضحة ومباشرة يفهمها كل خليجي.'
  },
  iraqi: {
    label: 'فصحى ميسّرة (العراق)',
    desc: 'الفصحى الواضحة المفهومة عند العراقيين: جمل واضحة، تراكيب مألوفة، شرح مبسّط.',
    guidance: 'اكتب بفصحى واضحة قريبة من أسلوب الدعاة والعلماء العراقيين: جمل قصيرة ومباشرة، شرح المفاهيم بشكل عملي وواضح، تجنب التراكيب الطويلة والألفاظ النادرة. لا تستخدم ألفاظاً عامية عراقية، بل اجعل الفصحى واضحة ومباشرة يفهمها كل عراقي.'
  },
  maghreb: {
    label: 'فصحى ميسّرة (المغرب العربي: المغرب والجزائر وتونس)',
    desc: 'الفصحى الواضحة المفهومة عند أهل المغرب العربي: جمل واضحة، تراكيب مألوفة، شرح مبسّط.',
    guidance: 'اكتب بفصحى واضحة قريبة من أسلوب الدعاة والعلماء المغاربة: جمل قصيرة ومباشرة، شرح المفاهيم بشكل عملي وواضح، تجنب التراكيب الطويلة والألفاظ النادرة التي لا يعرفها عموم الناس في المغرب العربي. لا تستخدم ألفاظاً عامية مغاربية، بل اجعل الفصحى واضحة ومباشرة.'
  },
  yemeni: {
    label: 'فصحى ميسّرة (اليمن)',
    desc: 'الفصحى الواضحة المفهومة عند اليمنيين: جمل واضحة، تراكيب مألوفة، شرح مبسّط.',
    guidance: 'اكتب بفصحى واضحة قريبة من أسلوب الدعاة والعلماء اليمنيين: جمل قصيرة ومباشرة، شرح المفاهيم بشكل عملي وواضح، تجنب التراكيب الطويلة والألفاظ النادرة. لا تستخدم ألفاظاً عامية يمنية، بل اجعل الفصحى واضحة ومباشرة يفهمها كل يمني.'
  },
  sudanese: {
    label: 'فصحى ميسّرة (السودان)',
    desc: 'الفصحى الواضحة المفهومة عند السودانيين: جمل واضحة، تراكيب مألوفة، شرح مبسّط.',
    guidance: 'اكتب بفصحى واضحة قريبة من أسلوب الدعاة والعلماء السودانيين: جمل قصيرة ومباشرة، شرح المفاهيم بشكل عملي وواضح، تجنب التراكيب الطويلة والألفاظ النادرة. لا تستخدم ألفاظاً عامية سودانية، بل اجعل الفصحى واضحة ومباشرة يفهمها كل سوداني.'
  },
};

export const SYSTEM_INSTRUCTION = `أنت خطيب مصقع وعالم شرعي وبليغ أديب متخصص في صياغة خطب الجمعة المحكمة والرفيعة.
تتقن أصول الخطابة الإسلامية وفق منهج أهل السنة والجماعة، مع الاستشهاد الدقيق بالآيات القرآنية المحكمة والأحاديث النبوية الصحيحة المخرجة بأمانة.

قواعد جوهرية وأساسية ملزمة في صياغة الخطبة:
1. البلاغة الفطرية وسحر «السهل الممتنع»:
   - اعتمد لغة عربية بسيطة وسهلة وواضحة يفهمها الرجل العامي وأي إنسان يعرف العربية دون عناء أو لبس، بعيداً عن الغريب أو التقعير أو التكلف الأكاديمي.
   - في الوقت ذاته، يجب أن تكون بلاغتها وفصاحتها وجمال سبكها مساوية لأرقى درجات الفصحى وأعذبها؛ ألفاظ مألوفة في تراكيب آسرة تمس الوجدان وتوقظ القلوب.
   - اشرح كل مفهوم تشرحه للناس العاديين: لا تفترض أنهم يعرفون المعنى العميق، بل وضّح المعنى بأسلوب مباشر وبسيط مع الحفاظ على الروحانية والبلاغة.
   - لا تستخدم مبالغات أو تعابير غير مألوفة عند العامة؛ كن صادقاً ومباشرًا في المعنى.
2. عدم التحيز لنصوص الكتب أو الملفات المرفوعة:
   - عند إرفاق كتاب أو ملف أو مستند، إياك أن يأخذك الكتاب أو الملف إلى التحيز لنصوصه الحرفية أو التقيد بعباراته وأسلوب مؤلفه.
   - الكتاب هو مصدر إلهام ومادة أولية للأفكار والمحاور فقط؛ واجبك هو تحرير المعاني في قالب خطبة منبرية حرة، حية، نابضة بالحياة، وإثراؤها بآيات وأحاديث شريفة مناسبة، وصياغتها بروح المنبر المستقلة التي تخاطب عموم الناس.
3. تكييف اللغة حسب اللهجة المطلوبة:
   - إذا طُلب منك اللهجة، ف عليك مراعاة ذلك في الأسلوب والشرح: اجعل الخطبة بالفصحى الواضحة الميسرة مع مراعاة خصوصيات بلاغة وأسلوب وطريقة شرح الناس من تلك اللهجة.
   - لا تستخدم ألفاظاً عامية في الخطبة، بل اجعل الفصحى واضحة ومباشرة يفهمها كل شخص من تلك اللهجة.
   - ركّز على شرح المعاني بشكل عملي وبسيط، لا تفترض أن الناس يعرفون المعنى العميق، بل وضّح المعنى بأسلوب مباشر يناسب أسلوب الخطابة المألوف في تلك اللهجة.

مهمتك تحويل الموضوعات، المقالات، الكتب، والمستندات إلى خطب جمعة نموذجية مكتملة الأركان:
1. خطبة الحاجة الشرعية المسنونة في المقدمة ("إن الحمد لله نحمده ونستعينه ونستغفره...").
2. براعة الاستهلال وربط المصلين بالموضوع، مع الوصية بتقوى الله.
3. صلب الخطبة الأولى: مقسم إلى عناصر وأفكار متسلسلة مدعمة بالشواهد والآيات (محاطة بـ ﴿ ﴾ واسم السورة ورقمها) والأحاديث الشريفة (محاطة بـ « » مع تخريجها المعتمد).
4. الختام بالاستغفار والدعوة لجلسة الاستراحة.
5. جلسة الاستراحة.
6. الخطبة الثانية: حمد وصلاة على النبي ﷺ، واستخلاص الدروس العملية والوصايا التطبيقية في واقع المصلين.
7. الدعاء الجامع المبارك والمؤثر للمسلمين، وصلاح الأمة، وتفريج الكروب، وختام بالصلاة على النبي ﷺ وتلاوة آية الأمر بالعدل والإحسان.
إذا طُلب سلسلة خطب (من كتاب أو موضوع كبير): قم بتقسيم الموضوع إلى الأجزاء المطلوبة بحيث تكون كل خطبة مستقلة بذاتها ولكنها حلقة مترابطة في السلسلة.

يجب إرجاع النتيجة بصيغة JSON حصراً وفق المخطط المطلوب.`;

// بناء محتوى الطلب (نصوص + ملفات/Pdf مرفوعة)
export function buildRequestParts(request: GenerateRequest): { promptText: string; parts: any[] } {
  const {
    mode,
    topic,
    category = '',
    dialect = 'msa',
    fileText,
    fileBase64,
    fileMimeType,
    fileName,
    length = 'medium',
    complexity = 'eloquent',
    tone = 'exhortative',
    isSeries = false,
    seriesPartsCount = 3,
    customInstructions = '',
  } = request;

  const targetLength = LENGTH_MAP[length] || LENGTH_MAP['medium'];
  const targetDialect = DIALECT_MAP[dialect] || DIALECT_MAP['msa'];

  let promptText = `المطلوب: صياغة خطبة جمعة وفق المحددات الآتية:
- الطول وعدد الكلمات المستهدف: ${targetLength.desc} (تنبيه حاسم: احرص على استيفاء الطول وتوليد نص ثري ومفصل ومكتمل يقارب ${targetLength.words} كلمة بدقة دون إيجاز مخل؛ بحيث تكون الخطبة الأولى وافية العناصر والخطبة الثانية مستوفية للدروس والتوجيهات العملية).
- مستوى البلاغة واللغة: ${COMPLEXITY_MAP[complexity] || COMPLEXITY_MAP['eloquent']}
- نبرة وأسلوب الخطبة: ${TONE_MAP[tone] || TONE_MAP['exhortative']}
- اللهجة الإقليمية: ${targetDialect.label} — ${targetDialect.guidance}
`;

  if (category) {
    promptText += `- القسم والفرع الشرعي المستهدف: ${category}\n`;
  }

  if (customInstructions) {
    promptText += `- توجيهات إضافية من الخطيب: ${customInstructions}\n`;
  }

  if (isSeries) {
    promptText += `- النمط: **سلسلة خطب متكاملة** عدد أجزائها (${seriesPartsCount} خطب). قم بتفصيل كل خطبة في السلسلة تفصيلاً منبرياً كاملاً مع عناصرها المستقلة.\n`;
  } else {
    promptText += `- النمط: **خطبة جمعة متكاملة** (خطبة أولى، جلسة استراحة، خطبة ثانية، دعاء).\n`;
  }

  const parts: any[] = [];

  if (fileBase64 && fileMimeType === 'application/pdf') {
    promptText += `\nالمصدر: ملف PDF مرفق (كتاب أو مستند).\nقاعدة ذهبية ملزمة: لا يأخذك الكتاب أو الملف المرفوع إلى التحيز لنصوصه الحرفية أو التقيد بأسلوبه الخاص؛ استلهم منه الفكرة والجوهر فقط، وأعد صياغة الخطبة بحرية بروح منبرية مستقلة نابضة بالحياة، وأثرها بالآيات والأحاديث النبوية، وصغها بأسلوب السهل الممتنع البليغ الذي يفهمه العامي وياسر قلوب المصلين.\nاسم الملف: ${fileName || 'مستند'}\n`;
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: fileBase64,
      },
    });
  } else if (fileText) {
    promptText += `\nالمصدر: نص مستخرج من مستند أو كتاب:\n"""\n${fileText.slice(0, 50000)}\n"""\nقاعدة ذهبية ملزمة: لا يأخذك الكتاب أو الملف المرفوع إلى التحيز لنصوصه الحرفية أو التقيد بأسلوبه الخاص؛ استلهم منه الفكرة والجوهر فقط، وأعد صياغة المعاني بحرية وبلاغة منبرية فصيحة وسلسة دون حشو أو تقيّد حرفي بنصوص المصدر.\nاسم الملف: ${fileName || 'مستند'}\n`;
  } else if (topic) {
    promptText += `\nالموضوع المختار: "${topic}"\n`;
  } else {
    promptText += `\nالموضوع: خطبة جمعة جامعة في تزكية النفوس وثمار الإيمان والتقوى.\n`;
  }

  parts.push({ text: promptText });
  return { promptText, parts };
}

// مخطط الاستجابة الموحد
export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'عنوان الخطبة البليغ والجذاب' },
    topic: { type: Type.STRING, description: 'الموضوع العام' },
    dialect: { type: Type.STRING, description: 'اللهجة الإقليمية المستخدمة في الخطبة' },
    isSeries: { type: Type.BOOLEAN, description: 'هل هي سلسلة خطب' },
    totalSeriesParts: { type: Type.INTEGER, description: 'عدد أجزاء السلسلة إذا كانت سلسلة' },
    mainPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'النقاط الرئيسية والعناصر المستخلصة من الموضوع',
    },
    quranCitations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          verse: { type: Type.STRING, description: 'نص الآية الكريمة مضبوطاً بالشكل' },
          surah: { type: Type.STRING, description: 'اسم السورة' },
          ayahNumber: { type: Type.STRING, description: 'رقم الآية أو مداها' },
        },
        required: ['verse', 'surah'],
      },
    },
    hadithCitations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hadith: { type: Type.STRING, description: 'متن الحديث الشريف مضبوطاً' },
          source: { type: Type.STRING, description: 'تخريج الحديث (مثال: صحيح البخاري)' },
          grade: { type: Type.STRING, description: 'درجة الحديث (صحيح، حسن)' },
        },
        required: ['hadith', 'source'],
      },
    },
    intro: { type: Type.STRING, description: 'خطبة الحاجة وبراعة الاستهلال والوصية بالتقوى' },
    firstKhutbah: { type: Type.STRING, description: 'صلب الخطبة الأولى كاملاً ومفصلاً مع الآيات والأحاديث' },
    pauseAdvice: { type: Type.STRING, description: 'جلسة الاستراحة' },
    secondKhutbah: { type: Type.STRING, description: 'الخطبة الثانية مع التوجيهات العملية' },
    supplication: { type: Type.STRING, description: 'الدعاء الجامع والختام والصلاة على النبي' },
    estimatedMinutes: { type: Type.INTEGER, description: 'زمن الإلقاء التقديري بالدقائق' },
    wordCount: { type: Type.INTEGER, description: 'عدد الكلمات الإجمالي' },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'وسوم وتصنيفات الخطبة',
    },
    seriesParts: {
      type: Type.ARRAY,
      description: 'قائمة أجزاء السلسلة في حال اختيار سلسلة خطب',
      items: {
        type: Type.OBJECT,
        properties: {
          partNumber: { type: Type.INTEGER },
          title: { type: Type.STRING, description: 'عنوان هذا الجزء من السلسلة' },
          summary: { type: Type.STRING, description: 'خلاصة هذا الجزء' },
          intro: { type: Type.STRING, description: 'مقدمة وخطبة الحاجة لهذا الجزء' },
          firstKhutbah: { type: Type.STRING, description: 'الخطبة الأولى لهذا الجزء' },
          pauseAdvice: { type: Type.STRING },
          secondKhutbah: { type: Type.STRING, description: 'الخطبة الثانية لهذا الجزء' },
          supplication: { type: Type.STRING, description: 'الدعاء والختام لهذا الجزء' },
          fullText: { type: Type.STRING },
          mainPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          quranCitations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                verse: { type: Type.STRING },
                surah: { type: Type.STRING },
                ayahNumber: { type: Type.STRING },
              },
            },
          },
          hadithCitations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hadith: { type: Type.STRING },
                source: { type: Type.STRING },
                grade: { type: Type.STRING },
              },
            },
          },
          estimatedMinutes: { type: Type.INTEGER },
          wordCount: { type: Type.INTEGER },
        },
      },
    },
  },
  required: [
    'title',
    'intro',
    'firstKhutbah',
    'secondKhutbah',
    'supplication',
    'mainPoints',
    'quranCitations',
    'hadithCitations',
  ],
};

// تحويل نص JSON الذي يرجع النموذج إلى كائن
export function parseGeneratedJson(rawText: string): any {
  let text = rawText.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(text);
}

// إنشاء الخطبة النهائية من بيانات النموذج وطلب المستخدم
export function finalizeSermon(generatedData: any, request: GenerateRequest): Sermon {
  const {
    topic,
    category = '',
    dialect = 'msa',
    length = 'medium',
    complexity = 'eloquent',
    tone = 'exhortative',
    isSeries = false,
    seriesPartsCount = 3,
    mode = 'topic',
  } = request;

  const targetLength = LENGTH_MAP[length] || LENGTH_MAP['medium'];

  const firstPart =
    generatedData.seriesParts && Array.isArray(generatedData.seriesParts) && generatedData.seriesParts.length > 0
      ? generatedData.seriesParts[0]
      : null;

  const intro = generatedData.intro || firstPart?.intro || '';
  const firstKhutbah = generatedData.firstKhutbah || firstPart?.firstKhutbah || '';
  const secondKhutbah = generatedData.secondKhutbah || firstPart?.secondKhutbah || '';
  const supplication = generatedData.supplication || firstPart?.supplication || '';
  const pauseText = generatedData.pauseAdvice || firstPart?.pauseAdvice || '(جلسة الاستراحة بين الخطبتين يسيراً)';

  const fullText = `${intro}\n\n${firstKhutbah}\n\n${pauseText}\n\n${secondKhutbah}\n\n${supplication}`;

  if (generatedData.seriesParts && Array.isArray(generatedData.seriesParts)) {
    generatedData.seriesParts = generatedData.seriesParts.map((part: any, idx: number) => {
      const pPause = part.pauseAdvice || pauseText;
      const pIntro = part.intro || intro;
      const pFirst = part.firstKhutbah || firstKhutbah;
      const pSecond = part.secondKhutbah || secondKhutbah;
      const pSupp = part.supplication || supplication;
      const pFull = part.fullText || `${pIntro}\n\n${pFirst}\n\n${pPause}\n\n${pSecond}\n\n${pSupp}`;
      const pWordCount = part.wordCount || (pFull ? pFull.split(/\s+/).filter(Boolean).length : 0);
      return {
        ...part,
        partNumber: part.partNumber || idx + 1,
        intro: pIntro,
        firstKhutbah: pFirst,
        secondKhutbah: pSecond,
        supplication: pSupp,
        pauseAdvice: pPause,
        fullText: pFull,
        estimatedMinutes: part.estimatedMinutes || targetLength.minutes,
        wordCount: pWordCount,
      };
    });
  }

  const sermonId = `sermon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const wordCount = (fullText || '').split(/\s+/).filter(Boolean).length;
  const now = new Date().toISOString();

  return {
    id: sermonId,
    title: generatedData.title || (topic ? `خطبة: ${topic}` : 'خطبة الجمعة المباركة'),
    topic: topic || generatedData.topic || 'موضوع عام',
    category: category || (isSeries ? 'سلاسل منبرية متكاملة' : 'العقيدة والإيمان'),
    downloadsCount: 0,
    viewsCount: 0,
    mode: mode || 'topic',
    dialect: dialect || 'msa',
    length,
    complexity,
    tone,
    isSeries: !!isSeries,
    totalSeriesParts: isSeries ? (generatedData.seriesParts?.length || seriesPartsCount) : undefined,
    currentSeriesPartIndex: isSeries ? 0 : undefined,
    seriesParts: generatedData.seriesParts || [],
    intro,
    firstKhutbah,
    pauseAdvice: pauseText,
    secondKhutbah,
    supplication,
    fullText,
    mainPoints: generatedData.mainPoints || [],
    quranCitations: generatedData.quranCitations || [],
    hadithCitations: generatedData.hadithCitations || [],
    estimatedMinutes: generatedData.estimatedMinutes || targetLength.minutes,
    wordCount: generatedData.wordCount || wordCount,
    createdAt: now,
    updatedAt: now,
    tags: generatedData.tags || ['خطبة جمعة', topic || 'موعظة', dialect === 'msa' ? 'فصحى عصرية' : dialect],
    notes: '',
  };
}

export function formatArabicErrorMessage(err: any): string {
  const msg = typeof err === 'string' ? err : err?.message || err?.statusText || JSON.stringify(err);
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
    return 'تشهد خوادم الذكاء الاصطناعي ضغطاً مؤقتاً في الطلبات، جرى تجربة عدة محاولات تلقائية. يرجى الانتظار بضع ثوانٍ وإعادة المحاولة.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    return 'تم الوصول للحد الأقصى المؤقت لمعدل الطلبات، يرجى الانتظار لحظات ثم المحاولة.';
  }
  if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403')) {
    return 'مفتاح الربط مع الذكاء الاصطناعي غير صالح أو غير متوفر.';
  }
  return 'حدث خطأ أثناء معالجة وصياغة الخطبة، يرجى المحاولة مرة أخرى.';
}