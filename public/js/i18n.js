/* Taste Lab — interface translations (ka / en / ru) and the language switcher.
   Admin-editable content (hero, FAQ, products, legal pages) is translated in the
   admin panel and arrives already localised from /api/site?lang=…

   Markup hooks:
     data-i18n="key"            sets textContent
     data-i18n-html="key"       sets innerHTML (only for our own dictionary strings)
     data-i18n-attr="aria-label:key;placeholder:key2"  */
(function () {
  const LANGS = ['ka', 'en', 'ru'];
  const KEY = 'tl_lang';

  const D = {
    ka: {
      'meta.title': 'Taste Lab — ჯანსაღი და ფუნქციური სნექები',
      'meta.description': 'Taste Lab — სუბლიმირებული (freeze-dried) მაწონი, იოგურტი, ხილი და ტკბილეული. შეუკვეთე ონლაინ.',
      skip: 'გადასვლა მაღაზიაზე', home: 'Taste Lab — მთავარი', announce: 'განცხადება',
      'nav.label': 'მთავარი ნავიგაცია', 'nav.shop': 'მაღაზია', 'nav.lab': 'ლაბორატორია', 'nav.about': 'ჩვენ შესახებ', 'nav.faq': 'კითხვები',
      cart: 'კალათა', menu: 'მენიუ', close: 'დახურვა', lang: 'ენა',
      'hero.chips': 'უპირატესობები', 'chip.natural': '🌿 ნატურალური', 'chip.georgia': '🇬🇪 შექმნილია საქართველოში',
      stats: 'ციფრები',
      'shop.eyebrow': '// 01 — მაღაზია', 'shop.title': 'ნიმუშების კოლექცია', 'shop.sub': 'ყოველი პაკეტი — ერთი ექსპერიმენტი, რომელიც წარმატებით დასრულდა.',
      categories: 'კატეგორიები', 'filter.all': 'ყველა',
      'cat.yogurt': 'მაწონი / იოგურტი', 'cat.fruit': 'ხილი', 'cat.sweets': 'ტკბილეული', 'cat.mix': 'მიქსი',
      'shop.empty': 'ამ კატეგორიაში პროდუქტი ჯერ არ არის — ექსპერიმენტი მიმდინარეობს 🧪',
      details: 'დეტალურად', 'add.to.cart': 'კალათაში დამატება', 'sold.out': 'ამოიწურა', 'to.cart': 'კალათაში',
      'no.more.stock': 'მარაგში მეტი აღარ არის 😔', 'added.to.cart': '„{name}“ დაემატა კალათაში',
      ingredients: 'შემადგენლობა', kcal: 'კკალ', protein: 'ცილა', carbs: 'ნახშირწყ.', fat: 'ცხიმი', 'per.100g': 'კვებითი ღირებულება 100 გ-ზე',
      decrease: 'შემცირება', increase: 'გაზრდა',
      'stock.out': '● მარაგში არ არის', 'stock.low': '● დარჩა მხოლოდ {n} ცალი', 'stock.ok': '● მარაგშია',
      'lab.eyebrow': '// 02 — ლაბორატორია',
      'mix.eyebrow': '// 03 — Lab Mix', 'mix.choose': 'აირჩიე გემოები', 'mix.min': 'აირჩიე მინიმუმ 2 ელემენტი',
      'mix.more': 'აირჩიე კიდევ {n} ელემენტი', 'mix.canadd': 'შეგიძლია დაამატო კიდევ {n}', 'mix.full': 'კოლბა სავსეა! ✨',
      'mix.max': 'მაქსიმუმ 4 ელემენტი ერთ კოლბაში 🧪', 'mix.added': 'შენი Lab Mix დაემატა კალათაში 🧪', formula: 'ფორმულა',
      'why.eyebrow': '// 04 — რატომ Taste Lab', 'why.title': 'მეცნიერება, რომელიც გემრიელია',
      'cmp.title': 'წყალი მიდის. გემო რჩება.', 'cmp.text': 'გადაწიე სლაიდერი და ნახე, როგორ იქცევა ახალი ხილი ჩვენს სნექად.',
      'cmp.label': 'სუბლიმაციის პროცესი', 'cmp.fresh': 'ახალი', 'cmp.dried': 'სუბლიმირებული',
      'cmp.weight': 'წონა', 'cmp.water': 'წყალი', 'cmp.vitamins': 'ვიტამინები', g: 'გ',
      reviews: 'მომხმარებლების შეფასებები', stars: '{n} ვარსკვლავი', logo: 'Taste Lab ლოგო',
      'faq.eyebrow': '// 05 — კითხვები', 'faq.title': 'ხშირად დასმული კითხვები',
      email: 'ელ-ფოსტა', 'nl.placeholder': 'შენი ელ-ფოსტა', subscribe: 'გამოწერა',
      'nl.ok': 'მადლობა! შენ ახლა ლაბორატორიის წევრი ხარ 🧪', 'nl.fail': 'ვერ მოხერხდა. შეამოწმე ელ-ფოსტა და სცადე თავიდან.',
      'f.nav': 'ნავიგაცია', 'f.contact': 'კონტაქტი', 'f.social': 'სოციალური', 'f.allcontacts': 'ყველა კონტაქტი →',
      'cart.title': 'შენი კალათა', subtotal: 'ჯამი', checkout: 'შეკვეთის გაფორმება →',
      'ship.start': 'დაამატე {amount}-ის პროდუქტი და მიწოდება <b>უფასოა</b>', 'ship.left': 'კიდევ <b>{amount}</b> და მიწოდება უფასოა 🚚', 'ship.free': '🎉 შენ მიიღე <b>უფასო მიწოდება!</b>',
      'cart.empty': 'კოლბა ცარიელია.<br>დაიწყე ექსპერიმენტი!', 'to.shop': 'მაღაზიაში →',
      'load.fail': 'საიტის ჩატვირთვა ვერ მოხერხდა. განაახლეთ გვერდი.', crunch: 'ხრაშ!|CRUNCH!|ხრუშ!|POP!',
      // checkout
      'co.title': 'შეკვეთის გაფორმება', 'co.back': '← მაღაზიაში დაბრუნება', 'co.contact': 'საკონტაქტო ინფორმაცია',
      'co.name': 'სახელი, გვარი *', 'co.phone': 'ტელეფონი *', 'co.delivery': 'მიწოდება', 'co.city': 'ქალაქი *',
      'co.address': 'მისამართი *', 'co.address.ph': 'ქუჩა, სახლი, ბინა', 'co.note': 'კომენტარი კურიერისთვის', 'co.payment': 'გადახდა',
      'co.agree': 'ვეთანხმები <a href="/terms" target="_blank">მომსახურების პირობებს</a> და <a href="/privacy" target="_blank">კონფიდენციალურობის პოლიტიკას</a>',
      'co.submit': 'შეკვეთის დადასტურება', 'co.summary': 'შეკვეთის შეჯამება', 'co.yours': 'შენი შეკვეთა', 'co.products': 'პროდუქტები', 'co.total': 'სულ',
      'co.free': 'უფასო', 'co.card': 'ბარათით ონლაინ', 'co.card.soon': 'მალე დაემატება', 'co.cash': 'გადახდა მიტანისას', 'co.cash.sub': 'ნაღდი ან ბარათით კურიერთან',
      'co.err.fields': 'გთხოვთ შეავსოთ სახელი და მისამართი.', 'co.err.phone': 'გთხოვთ მიუთითოთ სწორი ტელეფონის ნომერი.',
      'co.err.agree': 'შეკვეთისთვის საჭიროა მომსახურების პირობებზე თანხმობა.', 'co.err.send': 'შეკვეთა ვერ გაიგზავნა. სცადეთ თავიდან.', error: 'შეცდომა',
      'co.processing': 'მუშავდება…', 'co.redirect': 'გადამისამართება გადახდაზე…',
      'co.failed': 'გადახდა არ შედგა. შეკვეთა გაუქმდა — შეგიძლიათ სცადოთ თავიდან.', 'co.unknown': 'გადახდის სტატუსი ვერ დადასტურდა. თუ თანხა ჩამოგეჭრათ, დაგვიკავშირდით.',
      'co.empty': 'კალათა ცარიელია', 'co.empty.text': 'ჯერ აირჩიე შენი საყვარელი სნექები.',
      'co.thanks': 'მადლობა! შეკვეთა მიღებულია', 'co.paid': '✅ გადახდა წარმატებით შესრულდა.', 'co.pending': '⏳ გადახდა მუშავდება — დადასტურებისთანავე დაგიკავშირდებით.',
      'co.topay': 'სულ გადასახდელი: <b>{amount}</b>.', 'co.call': 'ჩვენი გუნდი მალე დაგიკავშირდება ტელეფონით მიწოდების დასაზუსტებლად.', 'co.home': 'მთავარზე დაბრუნება',
      cities: 'თბილისი|ბათუმი|ქუთაისი|რუსთავი|გორი|ზუგდიდი|თელავი|სხვა',
      // pages & footer
      'pg.back': '← მაღაზიაში', 'pg.todo': '[შეავსეთ ადმინში]', terms: 'მომსახურების პირობები', privacy: 'კონფიდენციალურობის პოლიტიკა', contact: 'კონტაქტი',
      'ct.title': 'დაგვიკავშირდით', 'ct.phone': 'ტელეფონი', 'ct.address': 'მისამართი', 'ct.hours': 'სამუშაო საათები', 'ct.social': 'სოციალური ქსელები',
      'ct.details': 'რეკვიზიტები', 'ct.company': 'კომპანია', 'ct.companyId': 'საიდენთიფიკაციო კოდი', 'ct.legal': 'იურიდიული მისამართი', 'ct.see': 'იხილეთ ასევე:',
      info: 'ინფორმაცია', 'pay.methods': 'მიღებული გადახდის მეთოდები', 'id.short': 'ს/კ',
      '404.title': 'ეს ნიმუში ლაბორატორიაში არ გვაქვს', '404.text': 'გვერდი, რომელსაც ეძებ, არ არსებობს ან გადატანილია.',
    },
    en: {
      'meta.title': 'Taste Lab — Healthy & Functional Snacks',
      'meta.description': 'Taste Lab — freeze-dried matsoni, yogurt, fruit and sweets. Order online with delivery across Georgia.',
      skip: 'Skip to shop', home: 'Taste Lab — home', announce: 'Announcement',
      'nav.label': 'Main navigation', 'nav.shop': 'Shop', 'nav.lab': 'The Lab', 'nav.about': 'About us', 'nav.faq': 'FAQ',
      cart: 'Cart', menu: 'Menu', close: 'Close', lang: 'Language',
      'hero.chips': 'Highlights', 'chip.natural': '🌿 Natural', 'chip.georgia': '🇬🇪 Made in Georgia',
      stats: 'Key figures',
      'shop.eyebrow': '// 01 — Shop', 'shop.title': 'The specimen collection', 'shop.sub': 'Every pack is an experiment that turned out right.',
      categories: 'Categories', 'filter.all': 'All',
      'cat.yogurt': 'Matsoni / yogurt', 'cat.fruit': 'Fruit', 'cat.sweets': 'Sweets', 'cat.mix': 'Mix',
      'shop.empty': 'Nothing in this category yet — the experiment is in progress 🧪',
      details: 'details', 'add.to.cart': 'Add to cart', 'sold.out': 'Sold out', 'to.cart': 'Add to cart',
      'no.more.stock': 'No more in stock 😔', 'added.to.cart': '“{name}” added to cart',
      ingredients: 'Ingredients', kcal: 'kcal', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', 'per.100g': 'Nutrition per 100 g',
      decrease: 'Decrease', increase: 'Increase',
      'stock.out': '● Out of stock', 'stock.low': '● Only {n} left', 'stock.ok': '● In stock',
      'lab.eyebrow': '// 02 — The Lab',
      'mix.eyebrow': '// 03 — Lab Mix', 'mix.choose': 'Choose flavours', 'mix.min': 'Choose at least 2 elements',
      'mix.more': 'Choose {n} more', 'mix.canadd': 'You can add {n} more', 'mix.full': 'The flask is full! ✨',
      'mix.max': 'Up to 4 elements per flask 🧪', 'mix.added': 'Your Lab Mix is in the cart 🧪', formula: 'Formula',
      'why.eyebrow': '// 04 — Why Taste Lab', 'why.title': 'Science that tastes good',
      'cmp.title': 'The water goes. The taste stays.', 'cmp.text': 'Move the slider to see fresh fruit turn into our snack.',
      'cmp.label': 'Freeze-drying process', 'cmp.fresh': 'Fresh', 'cmp.dried': 'Freeze-dried',
      'cmp.weight': 'Weight', 'cmp.water': 'Water', 'cmp.vitamins': 'Vitamins', g: 'g',
      reviews: 'Customer reviews', stars: '{n} stars', logo: 'Taste Lab logo',
      'faq.eyebrow': '// 05 — FAQ', 'faq.title': 'Frequently asked questions',
      email: 'Email', 'nl.placeholder': 'Your email', subscribe: 'Subscribe',
      'nl.ok': 'Thank you! You are now part of the lab 🧪', 'nl.fail': 'Something went wrong. Check the email and try again.',
      'f.nav': 'Navigation', 'f.contact': 'Contact', 'f.social': 'Social', 'f.allcontacts': 'All contacts →',
      'cart.title': 'Your cart', subtotal: 'Subtotal', checkout: 'Checkout →',
      'ship.start': 'Add {amount} of products and delivery is <b>free</b>', 'ship.left': '<b>{amount}</b> more for free delivery 🚚', 'ship.free': '🎉 You get <b>free delivery!</b>',
      'cart.empty': 'The flask is empty.<br>Start an experiment!', 'to.shop': 'Go to shop →',
      'load.fail': 'The site could not load. Please refresh the page.', crunch: 'CRUNCH!|POP!|CRACK!|SNAP!',
      'co.title': 'Checkout', 'co.back': '← Back to shop', 'co.contact': 'Contact details',
      'co.name': 'Full name *', 'co.phone': 'Phone *', 'co.delivery': 'Delivery', 'co.city': 'City *',
      'co.address': 'Address *', 'co.address.ph': 'Street, building, apartment', 'co.note': 'Note for the courier', 'co.payment': 'Payment',
      'co.agree': 'I agree to the <a href="/terms" target="_blank">Terms of Service</a> and the <a href="/privacy" target="_blank">Privacy Policy</a>',
      'co.submit': 'Place order', 'co.summary': 'Order summary', 'co.yours': 'Your order', 'co.products': 'Products', 'co.total': 'Total',
      'co.free': 'Free', 'co.card': 'Pay online by card', 'co.card.soon': 'Coming soon', 'co.cash': 'Pay on delivery', 'co.cash.sub': 'Cash or card to the courier',
      'co.err.fields': 'Please enter your name and address.', 'co.err.phone': 'Please enter a valid phone number.',
      'co.err.agree': 'Please accept the Terms of Service to place an order.', 'co.err.send': 'The order could not be sent. Please try again.', error: 'Error',
      'co.processing': 'Processing…', 'co.redirect': 'Redirecting to payment…',
      'co.failed': 'The payment did not go through and the order was cancelled. You can try again.', 'co.unknown': 'We could not confirm the payment status. If you were charged, please contact us.',
      'co.empty': 'Your cart is empty', 'co.empty.text': 'Pick your favourite snacks first.',
      'co.thanks': 'Thank you! Your order is in', 'co.paid': '✅ Payment completed successfully.', 'co.pending': '⏳ Payment is processing — we will contact you once it is confirmed.',
      'co.topay': 'Total to pay: <b>{amount}</b>.', 'co.call': 'Our team will call you shortly to arrange delivery.', 'co.home': 'Back to home',
      cities: 'Tbilisi|Batumi|Kutaisi|Rustavi|Gori|Zugdidi|Telavi|Other',
      'pg.back': '← Shop', 'pg.todo': '[fill in the admin panel]', terms: 'Terms of Service', privacy: 'Privacy Policy', contact: 'Contact',
      'ct.title': 'Get in touch', 'ct.phone': 'Phone', 'ct.address': 'Address', 'ct.hours': 'Opening hours', 'ct.social': 'Social media',
      'ct.details': 'Company details', 'ct.company': 'Company', 'ct.companyId': 'Identification code', 'ct.legal': 'Legal address', 'ct.see': 'See also:',
      info: 'Information', 'pay.methods': 'Accepted payment methods', 'id.short': 'ID',
      '404.title': 'This specimen is not in our lab', '404.text': 'The page you are looking for does not exist or has moved.',
    },
    ru: {
      'meta.title': 'Taste Lab — полезные и функциональные снеки',
      'meta.description': 'Taste Lab — сублимированные мацони, йогурт, фрукты и сладости. Заказ онлайн с доставкой по Грузии.',
      skip: 'Перейти в магазин', home: 'Taste Lab — главная', announce: 'Объявление',
      'nav.label': 'Основная навигация', 'nav.shop': 'Магазин', 'nav.lab': 'Лаборатория', 'nav.about': 'О нас', 'nav.faq': 'Вопросы',
      cart: 'Корзина', menu: 'Меню', close: 'Закрыть', lang: 'Язык',
      'hero.chips': 'Преимущества', 'chip.natural': '🌿 Натурально', 'chip.georgia': '🇬🇪 Сделано в Грузии',
      stats: 'Цифры',
      'shop.eyebrow': '// 01 — Магазин', 'shop.title': 'Коллекция образцов', 'shop.sub': 'Каждая упаковка — эксперимент, который удался.',
      categories: 'Категории', 'filter.all': 'Все',
      'cat.yogurt': 'Мацони / йогурт', 'cat.fruit': 'Фрукты', 'cat.sweets': 'Сладости', 'cat.mix': 'Микс',
      'shop.empty': 'В этой категории пока ничего нет — эксперимент идёт 🧪',
      details: 'подробнее', 'add.to.cart': 'В корзину', 'sold.out': 'Нет в наличии', 'to.cart': 'В корзину',
      'no.more.stock': 'Больше нет в наличии 😔', 'added.to.cart': '«{name}» добавлен в корзину',
      ingredients: 'Состав', kcal: 'ккал', protein: 'Белки', carbs: 'Углеводы', fat: 'Жиры', 'per.100g': 'Пищевая ценность на 100 г',
      decrease: 'Уменьшить', increase: 'Увеличить',
      'stock.out': '● Нет в наличии', 'stock.low': '● Осталось всего {n} шт.', 'stock.ok': '● В наличии',
      'lab.eyebrow': '// 02 — Лаборатория',
      'mix.eyebrow': '// 03 — Lab Mix', 'mix.choose': 'Выберите вкусы', 'mix.min': 'Выберите минимум 2 элемента',
      'mix.more': 'Выберите ещё {n}', 'mix.canadd': 'Можно добавить ещё {n}', 'mix.full': 'Колба заполнена! ✨',
      'mix.max': 'Не больше 4 элементов в колбе 🧪', 'mix.added': 'Ваш Lab Mix добавлен в корзину 🧪', formula: 'Формула',
      'why.eyebrow': '// 04 — Почему Taste Lab', 'why.title': 'Наука, которая вкусная',
      'cmp.title': 'Вода уходит. Вкус остаётся.', 'cmp.text': 'Передвиньте ползунок и посмотрите, как свежий фрукт превращается в наш снек.',
      'cmp.label': 'Процесс сублимации', 'cmp.fresh': 'Свежий', 'cmp.dried': 'Сублимированный',
      'cmp.weight': 'Вес', 'cmp.water': 'Вода', 'cmp.vitamins': 'Витамины', g: 'г',
      reviews: 'Отзывы покупателей', stars: '{n} звёзд', logo: 'Логотип Taste Lab',
      'faq.eyebrow': '// 05 — Вопросы', 'faq.title': 'Частые вопросы',
      email: 'Эл. почта', 'nl.placeholder': 'Ваш e-mail', subscribe: 'Подписаться',
      'nl.ok': 'Спасибо! Теперь вы часть лаборатории 🧪', 'nl.fail': 'Не получилось. Проверьте e-mail и попробуйте ещё раз.',
      'f.nav': 'Навигация', 'f.contact': 'Контакты', 'f.social': 'Соцсети', 'f.allcontacts': 'Все контакты →',
      'cart.title': 'Ваша корзина', subtotal: 'Итого', checkout: 'Оформить заказ →',
      'ship.start': 'Добавьте товаров на {amount} — и доставка <b>бесплатно</b>', 'ship.left': 'Ещё <b>{amount}</b> до бесплатной доставки 🚚', 'ship.free': '🎉 У вас <b>бесплатная доставка!</b>',
      'cart.empty': 'Колба пуста.<br>Начните эксперимент!', 'to.shop': 'В магазин →',
      'load.fail': 'Не удалось загрузить сайт. Обновите страницу.', crunch: 'ХРУСТ!|CRUNCH!|ХРУМ!|POP!',
      'co.title': 'Оформление заказа', 'co.back': '← Вернуться в магазин', 'co.contact': 'Контактные данные',
      'co.name': 'Имя и фамилия *', 'co.phone': 'Телефон *', 'co.delivery': 'Доставка', 'co.city': 'Город *',
      'co.address': 'Адрес *', 'co.address.ph': 'Улица, дом, квартира', 'co.note': 'Комментарий для курьера', 'co.payment': 'Оплата',
      'co.agree': 'Я принимаю <a href="/terms" target="_blank">условия обслуживания</a> и <a href="/privacy" target="_blank">политику конфиденциальности</a>',
      'co.submit': 'Подтвердить заказ', 'co.summary': 'Сводка заказа', 'co.yours': 'Ваш заказ', 'co.products': 'Товары', 'co.total': 'Итого',
      'co.free': 'Бесплатно', 'co.card': 'Онлайн-оплата картой', 'co.card.soon': 'Скоро', 'co.cash': 'Оплата при получении', 'co.cash.sub': 'Наличными или картой курьеру',
      'co.err.fields': 'Пожалуйста, укажите имя и адрес.', 'co.err.phone': 'Пожалуйста, укажите правильный номер телефона.',
      'co.err.agree': 'Для заказа нужно принять условия обслуживания.', 'co.err.send': 'Не удалось отправить заказ. Попробуйте ещё раз.', error: 'Ошибка',
      'co.processing': 'Обрабатываем…', 'co.redirect': 'Переходим к оплате…',
      'co.failed': 'Оплата не прошла, заказ отменён. Вы можете попробовать ещё раз.', 'co.unknown': 'Не удалось подтвердить статус оплаты. Если деньги списались, свяжитесь с нами.',
      'co.empty': 'Корзина пуста', 'co.empty.text': 'Сначала выберите любимые снеки.',
      'co.thanks': 'Спасибо! Заказ принят', 'co.paid': '✅ Оплата прошла успешно.', 'co.pending': '⏳ Оплата обрабатывается — мы свяжемся с вами после подтверждения.',
      'co.topay': 'К оплате: <b>{amount}</b>.', 'co.call': 'Наша команда скоро позвонит вам, чтобы согласовать доставку.', 'co.home': 'На главную',
      cities: 'Тбилиси|Батуми|Кутаиси|Рустави|Гори|Зугдиди|Телави|Другой',
      'pg.back': '← В магазин', 'pg.todo': '[заполните в админ-панели]', terms: 'Условия обслуживания', privacy: 'Политика конфиденциальности', contact: 'Контакты',
      'ct.title': 'Свяжитесь с нами', 'ct.phone': 'Телефон', 'ct.address': 'Адрес', 'ct.hours': 'Часы работы', 'ct.social': 'Соцсети',
      'ct.details': 'Реквизиты', 'ct.company': 'Компания', 'ct.companyId': 'Идентификационный код', 'ct.legal': 'Юридический адрес', 'ct.see': 'См. также:',
      info: 'Информация', 'pay.methods': 'Принимаемые способы оплаты', 'id.short': 'ИНН',
      '404.title': 'Такого образца в лаборатории нет', '404.text': 'Страница не существует или была перемещена.',
    },
  };

  function read() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(fromUrl)) {
      try { localStorage.setItem(KEY, fromUrl); } catch { /* ignore */ }
      return fromUrl;
    }
    try {
      const saved = localStorage.getItem(KEY);
      if (LANGS.includes(saved)) return saved;
    } catch { /* private mode */ }
    return 'ka';
  }

  const lang = read();
  document.documentElement.lang = lang;

  function t(key, vars) {
    let s = (D[lang] && D[lang][key]) ?? D.ka[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }

  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
    root.querySelectorAll('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      });
    });
  }

  function setLang(next) {
    if (!LANGS.includes(next) || next === lang) return;
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    const url = new URL(location.href);
    url.searchParams.delete('lang');
    location.href = url.toString();
  }

  // Language switcher: any element with [data-lang-switch] gets KA / EN / RU buttons.
  function renderSwitchers() {
    document.querySelectorAll('[data-lang-switch]').forEach((wrap) => {
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', t('lang'));
      wrap.innerHTML = LANGS.map((l) => `<button type="button" data-set-lang="${l}" aria-pressed="${l === lang}" class="${l === lang ? 'is-on' : ''}">${l === 'ka' ? 'ქარ' : l.toUpperCase()}</button>`).join('');
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-set-lang]');
    if (b) setLang(b.dataset.setLang);
  });

  function boot() {
    apply();
    renderSwitchers();
    const title = document.querySelector('[data-i18n-title]');
    if (title) document.title = t(title.dataset.i18nTitle);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.TLi18n = { lang, langs: LANGS, t, apply };
})();
