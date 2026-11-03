'use strict';

// English and Russian versions of the default content and products.
// Same shape as the Georgian content in seed.js; admins edit them in the panel.

const content = {
  en: {
    announcement: '🚚 Free delivery in Tbilisi from 50₾  •  Bite · Frutz · Popz  •  Made in Georgia',
    hero: {
      eyebrow: 'Research-driven food laboratory',
      title: 'The freeze-dried snack',
      highlight: 'laboratory',
      subtitle: 'Freeze-dried matsoni, yogurt, fruit and sweets. Frozen at −40°C and dried in a vacuum: the taste and vitamins stay, the water goes.',
      ctaPrimary: 'Shop now',
      ctaSecondary: 'How we make it',
    },
    stats: [
      { value: '97', suffix: '%', label: 'of nutrients preserved' },
      { value: '3', suffix: '', label: 'brands: Bite · Frutz · Popz' },
      { value: '-40', suffix: '°C', label: 'freezing temperature' },
      { value: '18', suffix: ' months', label: 'shelf life without preservatives' },
    ],
    process: {
      title: 'From our lab to your hand',
      subtitle: 'Sublimation, or freeze-drying: the technology NASA uses for astronaut food.',
      steps: [
        { temp: '+4°C', title: 'Selection', text: 'We pick ripe seasonal fruit and natural yogurt from local farmers.' },
        { temp: '-40°C', title: 'Flash freezing', text: 'The product freezes in seconds — water turns into tiny ice crystals without damaging the cells.' },
        { temp: '0.1 mbar', title: 'Vacuum', text: 'In the vacuum chamber the ice turns straight into vapour, skipping the liquid phase.' },
        { temp: '97%', title: 'Crunchy result', text: 'Colour, aroma and vitamins stay. What is left is a light, crunchy snack that melts in your mouth.' },
      ],
    },
    benefits: [
      { icon: '🌿', title: '100% natural', text: 'Bite and Frutz: only matsoni, yogurt and fruit. No GMOs, no preservatives, no added sugar.' },
      { icon: '🦠', title: 'Live probiotics', text: 'Bite matsoni and yogurt keep their live cultures and calcium. No added sugar.' },
      { icon: '🎒', title: 'Take it anywhere', text: 'Light and needs no fridge — for school, the office or a hike.' },
      { icon: '🧪', title: 'Lab-grade quality', text: 'Every batch passes quality control. Exact temperature, exact timing.' },
    ],
    mixer: {
      title: 'Create your Lab Mix',
      subtitle: 'Pick 2–4 flavours, drop them into the flask and get your personal formula.',
    },
    about: {
      title: 'We are Taste Lab',
      text: 'A Georgian food laboratory where science meets taste. We research, taste and refine until we get a snack that is both delicious and good for you.',
    },
    testimonials: [
      { name: 'Nino G.', text: 'My kid now asks for Bite instead of crisps. That is a win!', rating: 5 },
      { name: 'Giorgi M.', text: 'Took Frutz on a hike — light and full of energy. The feijoa is the best.', rating: 5 },
      { name: 'Ana K.', text: 'Strawberry cheesecake after a workout — sweet and full of protein.', rating: 5 },
      { name: 'Luka B.', text: 'Everyone at the office loves it. We order Frutz every week.', rating: 5 },
    ],
    faq: [
      { q: 'What is a freeze-dried product?', a: 'The product is frozen at −40°C, then in a vacuum the ice turns straight into vapour. What remains is a light, crunchy snack that keeps the taste, colour and 97% of the nutrients of the fruit.' },
      { q: 'Does it contain sugar or preservatives?', a: 'Bite and Frutz have no added sugar or preservatives — the sweetness is natural. Popz are sweets, so please check their ingredients on the pack.' },
      { q: 'From what age is it suitable for children?', a: 'Bite melts in the mouth and children love it. For very young children we recommend checking with a paediatrician first.' },
      { q: 'How should I store it?', a: 'In a dry, cool place. After opening, close the zip-lock pack tightly to keep moisture out.' },
      { q: 'How long does delivery take?', a: 'Tbilisi — 1–2 business days, regions — 2–4 business days.' },
    ],
    newsletter: {
      title: 'Join the lab',
      text: 'New flavours, experiments and discounts — you hear first.',
    },
    pages: {
      terms: {
        title: 'Terms of Service',
        body: `Last updated: November 2026

## 1. General
The website taste-lab.ge (the "Site") is owned by {{company}} (identification code: {{companyId}}, legal address: {{legalAddress}}). By placing an order on the Site you agree to these terms.

## 2. Products and prices
- The Site offers freeze-dried food products: Bite, Frutz and Popz.
- All prices are in Georgian lari (GEL, ₾).
- Product photos may differ slightly from the actual packaging.
- We may change prices; an order already placed keeps the price at the time of ordering.

## 3. Ordering and payment
- To place an order we need your name, phone number and delivery address.
- You can pay online — by Visa or Mastercard card, Google Pay or Apple Pay — or on delivery.
- Online payments are processed on the secure page of the Flitt payment system. Card details are not stored by us and are not available to us.
- An order paid online is confirmed once the payment has been completed successfully.

## 4. Delivery
- Delivery in Tbilisi takes 1–2 business days, in the regions 2–4 business days.
- Delivery costs {{deliveryFee}} {{currency}}. Orders over {{freeDeliveryFrom}} {{currency}} are delivered free of charge.
- The courier will call the phone number you provided before delivery.
- If delivery fails for reasons on the customer's side, a repeat delivery may be charged.

## 5. Cancellation and refunds
- You can cancel an order before it is dispatched — contact us by phone or email. In that case you receive a full refund.
- Products can be returned within 14 calendar days of receipt if the packaging is unopened and undamaged. For hygiene and food safety reasons, opened products cannot be returned.
- If you receive a damaged, expired or wrong product, send us a photo within 48 hours of receipt — we will replace the product or refund you in full, including delivery.
- Card payments are refunded to the same card within 5–10 business days (depending on the bank). Cash payments are refunded by bank transfer.
- The customer covers the cost of return delivery unless the return is caused by our mistake.

## 6. Liability
The ingredients of each product are listed in its description and on the pack. If you have allergies or dietary restrictions, please read the ingredients carefully.

## 7. Contact
Phone: {{phone}}
Email: {{email}}
Address: {{address}}`,
      },
      privacy: {
        title: 'Privacy Policy',
        body: `Last updated: November 2026

{{company}} (identification code: {{companyId}}) respects your privacy. This policy explains what data we collect on taste-lab.ge and how we use it.

## 1. What data we collect
- When you order: name, phone number, email (optional), delivery address and comment.
- Order details: products, amount, payment method and status.
- When you subscribe to news: your email.

## 2. Card details
Online payments are processed by the Flitt payment system. We do not receive or store your card number, expiry date or CVV code — they are entered directly on Flitt's secure page.

## 3. How we use the data
- To process and deliver your order;
- To contact you about your order;
- To send news — only if you subscribed.

## 4. Who we share data with
- Courier services — only the data needed for delivery (name, phone, address);
- The Flitt payment system — to process payments;
- Public authorities — only where required by law.
We do not sell your data or pass it to third parties for advertising.

## 5. Cookies and browser storage
The Site uses browser storage only to keep your cart. No advertising or tracking cookies are used.

## 6. Retention and security
We keep order data for as long as needed to fulfil the order and meet accounting obligations. Connections to the Site are protected with HTTPS.

## 7. Your rights
Under the Law of Georgia on Personal Data Protection you may request access to, correction or deletion of your data, and unsubscribe from news at any time. Send requests to: {{email}}.

## 8. Contact
{{company}}, {{legalAddress}}
Phone: {{phone}} · Email: {{email}}`,
      },
    },
  },

  ru: {
    announcement: '🚚 Бесплатная доставка по Тбилиси от 50₾  •  Bite · Frutz · Popz  •  Сделано в Грузии',
    hero: {
      eyebrow: 'Research-driven food laboratory',
      title: 'Лаборатория сублимированных',
      highlight: 'снеков',
      subtitle: 'Сублимированные мацони, йогурт, фрукты и сладости. Заморожены при −40°C и высушены в вакууме: вкус и витамины остаются, вода — нет.',
      ctaPrimary: 'Купить сейчас',
      ctaSecondary: 'Как мы готовим?',
    },
    stats: [
      { value: '97', suffix: '%', label: 'питательных веществ сохраняется' },
      { value: '3', suffix: '', label: 'бренда: Bite · Frutz · Popz' },
      { value: '-40', suffix: '°C', label: 'температура заморозки' },
      { value: '18', suffix: ' мес.', label: 'срок годности без консервантов' },
    ],
    process: {
      title: 'Из лаборатории — к вам в руки',
      subtitle: 'Сублимация, или freeze-drying: технология, которую NASA использует для питания астронавтов.',
      steps: [
        { temp: '+4°C', title: 'Отбор', text: 'Выбираем спелые сезонные фрукты и натуральный йогурт у местных фермеров.' },
        { temp: '-40°C', title: 'Шоковая заморозка', text: 'Продукт замерзает за секунды — вода превращается в крошечные кристаллы льда, клетки не повреждаются.' },
        { temp: '0.1 mbar', title: 'Вакуум', text: 'В вакуумной камере лёд сразу превращается в пар, минуя жидкую фазу.' },
        { temp: '97%', title: 'Хрустящий результат', text: 'Цвет, аромат и витамины сохраняются. Остаётся лёгкий хрустящий снек, который тает во рту.' },
      ],
    },
    benefits: [
      { icon: '🌿', title: '100% натурально', text: 'Bite и Frutz: только мацони, йогурт и фрукты. Без ГМО, консервантов и добавленного сахара.' },
      { icon: '🦠', title: 'Живые пробиотики', text: 'Мацони и йогурт Bite сохраняют живые культуры и кальций. Без добавленного сахара.' },
      { icon: '🎒', title: 'Берите с собой', text: 'Лёгкие и не требуют холодильника — в школу, в офис, в поход.' },
      { icon: '🧪', title: 'Лабораторное качество', text: 'Каждая партия проходит контроль качества. Точная температура, точное время.' },
    ],
    mixer: {
      title: 'Создайте свой Lab Mix',
      subtitle: 'Выберите 2–4 вкуса, отправьте их в колбу и получите свою формулу.',
    },
    about: {
      title: 'Мы — Taste Lab',
      text: 'Грузинская пищевая лаборатория, где наука встречается со вкусом. Мы исследуем, пробуем и дорабатываем, пока не получим снек, который одновременно вкусный и полезный.',
    },
    testimonials: [
      { name: 'Нино Г.', text: 'Ребёнок теперь просит Bite вместо чипсов. Это победа!', rating: 5 },
      { name: 'Гиорги М.', text: 'Взял Frutz в поход — лёгкий и даёт энергию. Фейхоа — лучшая.', rating: 5 },
      { name: 'Анна К.', text: 'Клубничный чизкейк после тренировки — и сладко, и белка много.', rating: 5 },
      { name: 'Лука Б.', text: 'В офисе все полюбили. Заказываем Frutz каждую неделю.', rating: 5 },
    ],
    faq: [
      { q: 'Что такое сублимированный (freeze-dried) продукт?', a: 'Продукт замораживают при −40°C, затем в вакууме лёд сразу превращается в пар. Остаётся лёгкий хрустящий снек, который сохраняет вкус, цвет и 97% питательных веществ фрукта.' },
      { q: 'Есть ли в составе сахар или консерванты?', a: 'В Bite и Frutz нет добавленного сахара и консервантов — сладость натуральная. Popz — это сладости, поэтому их состав смотрите на упаковке.' },
      { q: 'С какого возраста можно детям?', a: 'Bite тает во рту, и дети его любят. Для маленьких детей рекомендуем заранее проконсультироваться с педиатром.' },
      { q: 'Как хранить?', a: 'В сухом прохладном месте. После вскрытия плотно закройте zip-lock упаковку, чтобы не попала влага.' },
      { q: 'Сколько идёт доставка?', a: 'По Тбилиси — 1–2 рабочих дня, по регионам — 2–4 рабочих дня.' },
    ],
    newsletter: {
      title: 'Присоединяйтесь к лаборатории',
      text: 'Новые вкусы, эксперименты и скидки — вы узнаете первыми.',
    },
    pages: {
      terms: {
        title: 'Условия обслуживания',
        body: `Последнее обновление: ноябрь 2026 года

## 1. Общие положения
Сайт taste-lab.ge (далее — «Сайт») принадлежит компании {{company}} (идентификационный код: {{companyId}}, юридический адрес: {{legalAddress}}). Оформляя заказ на Сайте, вы соглашаетесь с этими условиями.

## 2. Товары и цены
- На Сайте представлены сублимированные (freeze-dried) продукты питания: Bite, Frutz и Popz.
- Все цены указаны в грузинских лари (GEL, ₾).
- Фото товара может немного отличаться от реальной упаковки.
- Мы оставляем за собой право менять цены; для уже оформленного заказа действует цена на момент заказа.

## 3. Заказ и оплата
- Для оформления заказа нужны имя, номер телефона и адрес доставки.
- Оплатить можно онлайн — картой Visa или Mastercard, через Google Pay или Apple Pay — либо при получении.
- Онлайн-оплата проходит на защищённой странице платёжной системы Flitt. Данные карты у нас не хранятся и нам недоступны.
- Заказ с онлайн-оплатой считается подтверждённым после успешного завершения оплаты.

## 4. Доставка
- Доставка по Тбилиси — 1–2 рабочих дня, по регионам — 2–4 рабочих дня.
- Стоимость доставки — {{deliveryFee}} {{currency}}. При заказе от {{freeDeliveryFrom}} {{currency}} доставка бесплатная.
- Перед доставкой курьер позвонит по указанному номеру телефона.
- Если доставка не удалась по вине покупателя, повторная доставка может быть платной.

## 5. Отмена заказа и возврат денег
- Заказ можно отменить до его отправки — свяжитесь с нами по телефону или по электронной почте. В этом случае деньги возвращаются полностью.
- Товар можно вернуть в течение 14 календарных дней с момента получения, если упаковка не вскрыта и не повреждена. По соображениям гигиены и безопасности пищевых продуктов вскрытый товар не возвращается.
- Если вы получили повреждённый, просроченный или не тот товар, пришлите нам фото в течение 48 часов после получения — мы заменим товар или полностью вернём деньги, включая стоимость доставки.
- Деньги, оплаченные картой, возвращаются на ту же карту в течение 5–10 рабочих дней (срок зависит от банка). При оплате наличными — банковским переводом.
- Стоимость обратной доставки оплачивает покупатель, если возврат не вызван нашей ошибкой.

## 6. Ответственность
Состав каждого товара указан в его описании и на упаковке. При аллергии или ограничениях в питании, пожалуйста, внимательно ознакомьтесь с составом.

## 7. Контакты
Телефон: {{phone}}
Эл. почта: {{email}}
Адрес: {{address}}`,
      },
      privacy: {
        title: 'Политика конфиденциальности',
        body: `Последнее обновление: ноябрь 2026 года

Компания {{company}} (идентификационный код: {{companyId}}) уважает вашу личную информацию. Эта политика объясняет, какие данные мы собираем на taste-lab.ge и как их используем.

## 1. Какие данные мы собираем
- При заказе: имя, номер телефона, e-mail (необязательно), адрес доставки и комментарий.
- Данные заказа: товары, сумма, способ и статус оплаты.
- При подписке на новости: e-mail.

## 2. Данные карты
Онлайн-оплата обрабатывается платёжной системой Flitt. Мы не получаем и не храним номер карты, срок действия и CVV-код — они вводятся напрямую на защищённой странице Flitt.

## 3. Для чего мы используем данные
- Для обработки и доставки заказа;
- Чтобы связаться с вами по поводу заказа;
- Для отправки новостей — только если вы подписались.

## 4. Кому мы передаём данные
- Курьерской службе — только данные, нужные для доставки (имя, телефон, адрес);
- Платёжной системе Flitt — для обработки оплаты;
- Государственным органам — только в случаях, предусмотренных законом.
Мы не продаём ваши данные и не передаём их третьим лицам в рекламных целях.

## 5. Cookies и память браузера
Сайт использует память браузера только для хранения корзины. Рекламные и отслеживающие cookies не используются.

## 6. Срок хранения и безопасность
Данные заказа хранятся столько, сколько нужно для выполнения заказа и бухгалтерских обязательств. Соединение с Сайтом защищено HTTPS.

## 7. Ваши права
В соответствии с Законом Грузии «О защите персональных данных» вы можете запросить доступ к своим данным, их исправление или удаление, а также отписаться от новостей. Запросы отправляйте на: {{email}}.

## 8. Контакты
{{company}}, {{legalAddress}}
Телефон: {{phone}} · Эл. почта: {{email}}`,
      },
    },
  },
};

const products = {
  'bite-raspberry-matsoni': {
    en: { name: 'Bite — Raspberry Matsoni', tagline: 'Live probiotics, 100% natural', description: 'Freeze-dried matsoni with raspberry. Live probiotics and a source of calcium, no GMOs and no added sugar. Melts in the mouth, leaving the tang of matsoni and the sweetness of raspberry.', ingredients: 'Matsoni, raspberry', badge: 'Bestseller', weight: '20 g' },
    ru: { name: 'Bite — Мацони с малиной', tagline: 'Живые пробиотики, 100% натурально', description: 'Сублимированный мацони с малиной. Живые пробиотики и источник кальция, без ГМО и добавленного сахара. Тает во рту, оставляя кислинку мацони и сладость малины.', ingredients: 'Мацони, малина', badge: 'Хит продаж', weight: '20 г' },
  },
  'bite-blackcurrant-yogurt': {
    en: { name: 'Bite — Blackcurrant Yogurt', tagline: 'Live probiotics, a source of calcium', description: 'Freeze-dried yogurt with blackcurrant. Live probiotics, 100% natural ingredients, no GMOs and no added sugar.', ingredients: 'Yogurt, blackcurrant', badge: '', weight: '20 g' },
    ru: { name: 'Bite — Йогурт с чёрной смородиной', tagline: 'Живые пробиотики, источник кальция', description: 'Сублимированный йогурт с чёрной смородиной. Живые пробиотики, 100% натуральный состав, без ГМО и добавленного сахара.', ingredients: 'Йогурт, чёрная смородина', badge: '', weight: '20 г' },
  },
  'bite-strawberry-cheesecake': {
    en: { name: 'Bite — Strawberry Cheesecake', tagline: 'Functional snack, high in protein', description: 'A freeze-dried functional snack with a strawberry cheesecake taste. High in protein (18 g), rich in calcium, with a melt-in-your-mouth texture. Perfect after a workout.', ingredients: '', badge: 'Gym-friendly', weight: '20 g' },
    ru: { name: 'Bite — Клубничный чизкейк', tagline: 'Функциональный снек с высоким содержанием белка', description: 'Сублимированный функциональный снек со вкусом клубничного чизкейка. Много белка (18 г), богат кальцием, тает во рту. Идеален после тренировки.', ingredients: '', badge: 'Gym-friendly', weight: '20 г' },
  },
  'frutz-fruit-mix': {
    en: { name: 'Frutz — Fruit Mix', tagline: 'Crunch the impossible', description: 'A freeze-dried fruit mix: strawberry, feijoa and other fruit in one pack. 100% real fruit, no added sugar, made in Georgia. 140 kcal per pack.', ingredients: '100% fruit', badge: 'New', weight: '40 g' },
    ru: { name: 'Frutz — Фруктовый микс', tagline: 'Crunch the impossible', description: 'Сублимированный фруктовый микс: клубника, фейхоа и другие фрукты в одной упаковке. 100% настоящие фрукты, без добавленного сахара, сделано в Грузии. 140 ккал в упаковке.', ingredients: '100% фрукты', badge: 'Новинка', weight: '40 г' },
  },
  'popz-freeze-dried-sweets': {
    en: { name: 'Popz — Freeze-dried Sweets', tagline: 'Airy, crunchy, colourful', description: 'Favourite sweets transformed by freeze-drying: they puff up, turn airy and crunchy, and the taste gets more intense.', ingredients: '', badge: '', weight: '' },
    ru: { name: 'Popz — Сублимированные сладости', tagline: 'Воздушные, хрустящие, яркие', description: 'Любимые сладости, преображённые сублимацией: они раздуваются, становятся воздушными и хрустящими, а вкус — ярче.', ingredients: '', badge: '', weight: '' },
  },
  'bite-berry-mix': {
    en: { name: 'Bite — Berry Mix', tagline: '2+ billion probiotics, 65 kcal', description: 'A freeze-dried functional snack with berries. 2+ billion probiotics, high in protein (5 g), vitamins A, C and E, rich in calcium. 65 kcal.', ingredients: '', badge: '', weight: '20 g' },
    ru: { name: 'Bite — Ягодный микс', tagline: '2+ млрд пробиотиков, 65 ккал', description: 'Сублимированный функциональный снек с ягодами. Более 2 млрд пробиотиков, много белка (5 г), витамины A, C и E, богат кальцием. 65 ккал.', ingredients: '', badge: '', weight: '20 г' },
  },
};

module.exports = { content, products };
