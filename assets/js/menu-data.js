// Menu content. Every visible string is [english, turkish].
// i(name, price, photo, desc, extra, focus) — photo is a slug in assets/img (null = no photo).
// focus (Grill cards only) is the horizontal photo position, e.g. "0%" shows the left side.
// Prices and items cleaned up from huqqalounge.com/menu on 2026-10-01.

const i = (name, price, img, desc, extra, focus) => ({ name, price, img, desc, extra, focus });
const d = (name, price, img, opts = {}) => ({ name, price, img, ...opts });
// v(i(...)) marks a dish as vegetarian (shows a small "V").
const v = (item) => ({ ...item, veg: true });
// Photo map for a drink that has one photo per flavor, hot and (optionally) iced.
const variants = (flavors, hot, iced) => Object.fromEntries(flavors.flatMap((f) => {
  const slug = f.toLowerCase().replace(/ /g, "-");
  return [[f, hot + slug]].concat(iced ? [["Iced " + f, iced + slug]] : []);
}));
const SYRUPS = [["Vanilla", "Vanilya"], ["Caramel", "Karamel"], ["Hazelnut", "Fındık"], ["Nutella", "Nutella"]];
const TEAS = [["Green", "Yeşil çay"], ["Lemon ginger", "Limon zencefil"], ["Linden", "Ihlamur"],
  ["Apple cinnamon", "Elma tarçın"], ["Wild sweet orange", "Portakal"], ["Wild berries", "Orman meyvesi"]];

window.MENU = {
  info: {
    phone: "(703) 439-2222",
    phoneHref: "tel:+17034392222",
    address: "2828 Fallfax Dr, Falls Church, VA 22042",
    mapsHref: "https://maps.google.com/?q=2828+Fallfax+Dr,+Falls+Church,+VA+22042",
    // Hours from Apple Maps (2026-10-02); huqqalounge.com shows older hours (closing 12 AM, Sat 11 AM).
    hours: [
      [["Mon – Thu", "Pzt – Prş"], ["11 AM – 1 AM", "11:00 – 01:00"]],
      [["Friday", "Cuma"], ["11 AM – 2 AM", "11:00 – 02:00"]],
      [["Saturday", "Cumartesi"], ["9 AM – 2 AM", "09:00 – 02:00"]],
      [["Sunday", "Pazar"], ["9 AM – 1 AM", "09:00 – 01:00"]],
    ],
    // The kitchen closes 1 hour before the lounge. closes: lounge closing hour per weekday (0 = Sunday),
    // counted from that day's midnight, so 25 = 1 AM the next morning.
    kitchen: {
      closes: [25, 25, 25, 25, 25, 26, 26],
      note: ["Kitchen closes 1 hour before closing.", "Mutfak, kapanıştan 1 saat önce kapanır."],
      soon: ["Kitchen closes at {k} · last food orders in {t}", "Mutfak kapanışı {k} · son yemek siparişi için {t} kaldı"],
      closed: ["Kitchen is closed for tonight · drinks, select desserts and hookah until {c}. Please ask your server.",
        "Mutfak bu akşamlık kapandı · içecek, seçili tatlılar ve nargile servisi devam ediyor (kapanış {c}). Lütfen garsonunuza sorun."],
    },
    reviewHref: "https://search.google.com/local/writereview?placeid=ChIJscdLSLtLtokRQZRE9cWgQ4M",
    instagram: "@huqqaloungeva",
    instagramHref: "https://www.instagram.com/huqqaloungeva",
    wifi: { network: "HuqqaLounge-Guest", password: "washington" },
  },

  // Featured tab: references items by section id + item name (English).
  featured: [
    ["grill", "Huqqa Mix Kebab"],
    ["sandwiches", "Adana Wrap"],
    ["grill", "Chicken Shish Kebab"],
    ["oven", "Lahmacun"],
    ["breakfast", "Serpme Turkish Breakfast"],
    ["desserts", "Künefe"],
    ["grill", "Adana Kebab"],
  ],

  sections: [
    {
      id: "breakfast",
      title: ["Breakfast", "Kahvaltı"],
      tag: ["Morning table", "Sabah sofrası"],
      carousel: ["Serpme Turkish Breakfast", "Huqqa Breakfast Platter", "Menemen"],
      layout: "grid",
      groups: [
        {
          title: ["For sharing", "Paylaşmalık"],
          items: [
            i(["Serpme Turkish Breakfast", "Serpme Kahvaltı"], "$69.90", "serpme-turkish-breakfast",
              ["The full Turkish spread for sharing: cheese platter, walnuts, grapes, tomatoes, cucumbers, bal kaymak, tahini and date, pickles, olive spread, fried peppers with yogurt, sausage, sigara börek, olives, fries, labneh, acuka, hazelnut spread, jam, sucuk with eggs, menemen, pişi, simit, bread and a pot of Turkish tea.",
               "Paylaşmalık tam Türk sofrası: peynir tabağı, ceviz, üzüm, domates, salatalık, bal kaymak, tahin ve hurma, turşu, zeytin ezmesi, yoğurtlu biber kızartması, sosis, sigara böreği, zeytin, patates kızartması, labne, acuka, fındık kreması, reçel, sucuklu yumurta, menemen, pişi, simit, ekmek ve bir demlik çay."]),
            i(["Huqqa Breakfast Platter", "Huqqa Kahvaltı Tabağı"], "$30.00", "huqqa-breakfast-platter",
              ["Cheese platter, tomatoes, cucumbers, black and green olives, bal kaymak, hazelnut spread, jam, sucuk with egg, simit, bread and a glass of Turkish tea.",
               "Peynir tabağı, domates, salatalık, siyah ve yeşil zeytin, bal kaymak, fındık kreması, reçel, sucuklu yumurta, simit, ekmek ve bir bardak çay."]),
          ],
        },
        {
          title: ["Eggs and classics", "Yumurta ve klasikler"],
          items: [
            v(i(["Plain Eggs", "Sahanda Yumurta"], "$10.90", "plain-eggs", ["Two eggs.", "İki yumurta."])),
            i(["Sucuk with Egg", "Sucuklu Yumurta"], "$13.90", "turkish-sujuk-w-egg", ["Two eggs, Turkish sucuk.", "İki yumurta, sucuk."]),
            i(["Ground Beef with Egg", "Kıymalı Yumurta"], "$14.90", "ground-beef-w-egg", ["Two eggs, seasoned ground beef.", "İki yumurta, baharatlı kıyma."]),
            v(i(["Plain Omelet", "Sade Omlet"], "$10.90", "plain-omelet", ["Two eggs.", "İki yumurta."])),
            v(i(["Cheese Omelet", "Peynirli Omlet"], "$11.90", "cheese-omelet", ["Two eggs, mozzarella.", "İki yumurta, mozzarella."])),
            i(["Sucuk Omelet", "Sucuklu Omlet"], "$13.90", "turkish-sujuk-omelet", ["Two eggs, Turkish sucuk.", "İki yumurta, sucuk."]),
            v(i(["Veggie Omelet", "Sebzeli Omlet"], "$12.90", "veggie-omelet", ["Two eggs, onion, tomato, green pepper, mushroom.", "İki yumurta, soğan, domates, yeşil biber, mantar."])),
            v(i(["Menemen", "Menemen"], "$14.90", "menemen", ["Scrambled eggs with tomatoes, green peppers and onions.", "Domates, yeşil biber ve soğanla pişmiş yumurta."])),
          ],
        },
      ],
    },

    {
      id: "appetizers",
      title: ["Appetizers", "Başlangıçlar"],
      tag: ["To share", "Paylaşmalık"],
      carousel: ["Mixed Appetizers", "Hummus", "Fun Basket"],
      layout: "grid",
      groups: [
        {
          title: ["Soup and cold mezze", "Çorba ve soğuk mezeler"],
          items: [
            v(i(["Mixed Appetizers", "Karışık Meze Tabağı"], "$19.90", "mixed-appetizers", ["Hummus, labneh, muhammara, cacık, falafel (2), sigara börek (2).", "Humus, labne, muhammara, cacık, falafel (2), sigara böreği (2)."])),
            v(i(["Lentil Soup", "Mercimek Çorbası"], "$8.99", "lentil-soup", ["Red lentils, carrots, potatoes, onions and spices.", "Kırmızı mercimek, havuç, patates, soğan ve baharat."])),
            v(i(["Hummus", "Humus"], "$8.50", "hummus", ["Chickpeas, tahini, garlic, olive oil and lemon.", "Nohut, tahin, sarımsak, zeytinyağı ve limon."],
              ["Add beef +$6 · add chicken +$5", "Etli +$6 · tavuklu +$5"])),
            v(i(["Labneh", "Labne"], "$8.50", "labneh", ["Strained yogurt with olive oil.", "Zeytinyağlı süzme yoğurt."])),
            v(i(["Baba Ganoush", "Baba Ganuş"], "$8.50", "baba-ganoush", ["Smoky charred eggplant with tahini, garlic and lemon.", "Tahin, sarımsak ve limonlu közlenmiş patlıcan."])),
            v(i(["Cacık (Tzatziki)", "Cacık"], "$8.50", "cacik-tzatziki", ["Strained yogurt, cucumber, olive oil, garlic and mint.", "Süzme yoğurt, salatalık, zeytinyağı, sarımsak ve nane."])),
            v(i(["Ezme", "Ezme"], "$9.90", "ezme", ["Finely chopped tomatoes, cucumbers, onions, mild peppers, parsley and olive oil.", "İnce kıyılmış domates, salatalık, soğan, tatlı biber, maydanoz ve zeytinyağı."])),
            v(i(["Falafel (6)", "Falafel (6)"], "$9.50", "falafel-6", ["Chickpeas, parsley, tomatoes, cilantro and spices.", "Nohut, maydanoz, domates, kişniş ve baharat."])),
          ],
        },
        {
          title: ["Hot starters", "Sıcak başlangıçlar"],
          items: [
            i(["Fun Basket", "Atıştırmalık Sepeti"], "$17.50", "fun-basket", ["Onion rings (3), sigara börek (2), beef sausage (2), chicken nuggets (3), fries.", "Soğan halkası (3), sigara böreği (2), dana sosis (2), tavuk nugget (3), patates kızartması."]),
            v(i(["Sigara Börek (5)", "Sigara Böreği (5)"], "$8.99", "sigara-borek", ["Fried phyllo rolls with feta and parsley.", "Beyaz peynirli ve maydanozlu kızarmış yufka."])),
            i(["Sucuk", "Sucuk"], "$11.90", "sucuk", ["Pan-fried Turkish sausage.", "Tavada sucuk."]),
            i(["Liver", "Ciğer Sote"], "$15.90", "liver", ["Pan-sautéed liver with onions, tomatoes and parsley.", "Soğan, domates ve maydanozla tavada ciğer."]),
            i(["Chicken Wings (6)", "Tavuk Kanat (6)"], "$14.90", "chicken-wings-6", ["Choose one: hot, mild, BBQ or plain.", "Seçiminiz: acılı, az acılı, barbekü veya sade."]),
            v(i(["Fries", "Patates Kızartması"], "$7.90", "fries", ["Crispy golden french fries.", "Çıtır patates kızartması."])),
            v(i(["Onion Rings", "Soğan Halkası"], "$8.50", "onion-rings", ["Battered and fried onion rings.", "Kaplamalı kızarmış soğan halkaları."])),
          ],
        },
        {
          title: ["Gözleme", "Gözleme"],
          items: [
            v(i(["Cheese Gözleme", "Peynirli Gözleme"], "$15.50", "cheese-gozleme", ["Thin layers of dough filled with mozzarella.", "Mozzarella dolgulu ince hamur."])),
            v(i(["Potato Cheese Gözleme", "Patatesli Peynirli Gözleme"], "$15.50", "potato-cheese-gozleme", ["Filled with potato and cheese.", "Patates ve peynir dolgulu."])),
            i(["Ground Beef Gözleme", "Kıymalı Gözleme"], "$17.50", "ground-beef-gozleme", ["Filled with ground beef and mozzarella.", "Kıyma ve mozzarella dolgulu."]),
          ],
        },
      ],
    },

    {
      id: "salads",
      title: ["Salads", "Salatalar"],
      tag: ["Fresh and vibrant", "Taze ve canlı"],
      layout: "grid",
      groups: [
        {
          items: [
            v(i(["Gavurdağı Salad", "Gavurdağı Salatası"], "$9.99", "gavurdagi-salad", ["Cucumbers, tomatoes, parsley, onions, peppers, walnuts, pomegranate sauce and olive oil.", "Salatalık, domates, maydanoz, soğan, biber, ceviz, nar ekşisi ve zeytinyağı."])),
            v(i(["Fattoush Salad", "Fattuş Salatası"], "$9.99", "fattoush-salad", ["Lettuce, tomatoes, cucumbers, mint, parsley, crispy pita, sumac, lemon and olive oil.", "Marul, domates, salatalık, nane, maydanoz, çıtır pide, sumak, limon ve zeytinyağı."])),
            v(i(["Tabouleh", "Tabule"], "$9.99", "tabouleh", ["Parsley, cracked wheat, mint, tomatoes, lemon and olive oil.", "Maydanoz, bulgur, nane, domates, limon ve zeytinyağı."])),
            v(i(["Shepherd's Salad", "Çoban Salata"], "$9.99", "shepperd-salad", ["Lettuce, cucumber, tomato, onion, green pepper.", "Marul, salatalık, domates, soğan, yeşil biber."])),
            v(i(["Mediterranean Salad", "Akdeniz Salatası"], "$9.99", "mediterranean-salad", ["Lettuce, cucumber, tomato, onion, feta, black olives.", "Marul, salatalık, domates, soğan, beyaz peynir, siyah zeytin."])),
          ],
        },
      ],
    },

    {
      id: "sandwiches",
      title: ["Sandwiches and Burgers", "Sandviç ve Burger"],
      tabTitle: ["Sandwiches", "Sandviçler"],
      tag: ["Crafted to perfection", "Özenle hazırlanır"],
      carousel: ["Adana Wrap", "Huqqa Special Burger", "Kumru"],
      layout: "grid",
      groups: [
        {
          title: ["Wraps and sandwiches", "Dürüm ve sandviç"],
          items: [
            i(["Steak and Cheese (Sub Roll)", "Etli Peynirli Sandviç"], "$16.99", "steak-cheese-sub-roll", ["Sliced steak, sautéed peppers and onions, cheese and mayonnaise.", "Dilim et, sote biber ve soğan, peynir ve mayonez."]),
            i(["Kumru", "Kumru"], "$17.99", "kumru", ["Pan-fried sausage and sucuk, cheese and mayonnaise.", "Tavada sosis ve sucuk, peynir ve mayonez."]),
            i(["Chicken Shawarma Wrap", "Tavuk Shawarma Dürüm"], "$15.99", "chicken-shawarma-wrap", ["Shawarma chicken, tomatoes, lettuce, pickles and garlic sauce.", "Shawarma tavuk, domates, marul, turşu ve sarımsaklı sos."]),
            v(i(["Falafel Wrap", "Falafel Dürüm"], "$15.99", "falafel-wrap", ["Falafel, tomatoes, lettuce, pickles and mayonnaise.", "Falafel, domates, marul, turşu ve mayonez."])),
            i(["Köfte Sandwich", "Köfte Ekmek"], "$16.99", "kofte-sandwich", ["Grilled beef patties, tomatoes, lettuce, onions and mayonnaise.", "Izgara köfte, domates, marul, soğan ve mayonez."]),
            i(["Adana Wrap", "Adana Dürüm"], "$17.99", "adana-wrap", ["Ground beef and lamb with tomatoes, parsley, onions and sumac.", "Dana ve kuzu kıyma, domates, maydanoz, soğan ve sumak."]),
            i(["Chicken Sandwich", "Tavuk Sandviç"], "$15.99", "chicken-sandwich", ["Grilled marinated chicken, tomatoes, lettuce, onions and mayonnaise.", "Marine ızgara tavuk, domates, marul, soğan ve mayonez."]),
            v(i(["Patso", "Patso"], "$12.50", "patso", ["Fries, ketchup and mayonnaise.", "Patates kızartması, ketçap ve mayonez."])),
          ],
        },
        {
          title: ["Burgers", "Burgerler"],
          note: ["Served with fries · add a patty +$7", "Patates kızartmasıyla servis edilir · ekstra köfte +$7"],
          items: [
            i(["Hamburger", "Hamburger"], "$16.90", "hamburger", ["Beef patty, lettuce, tomato, onion, pickles and special sauce.", "Dana köfte, marul, domates, soğan, turşu ve özel sos."]),
            i(["Cheeseburger", "Cheeseburger"], "$17.90", "cheeseburger", ["Beef patty with melted cheese, lettuce, tomato, onion, pickles and special sauce.", "Eritilmiş peynirli dana köfte, marul, domates, soğan, turşu ve özel sos."]),
            i(["Grilled Chicken Burger", "Izgara Tavuk Burger"], "$16.90", "grilled-chicken-burger", ["Grilled marinated chicken breast, lettuce, tomato, onion and mayonnaise.", "Marine ızgara tavuk göğsü, marul, domates, soğan ve mayonez."]),
            i(["Huqqa Special Burger", "Huqqa Özel Burger"], "$18.90", "huqqa-special-burger", ["Premium beef patty, caramelized onions, special sauce, cheese and house toppings.", "Özel dana köfte, karamelize soğan, özel sos, peynir ve ev malzemeleri."]),
          ],
        },
        {
          title: ["Panini press", "Tost"],
          note: ["Add egg +$1", "Yumurta ekle +$1"],
          items: [
            i(["Sucuk Tost", "Sucuklu Tost"], "$14.90", "sucuk-tost", ["Turkish sucuk, cheese, tomato paste and butter.", "Sucuk, peynir, domates salçası ve tereyağı."]),
            i(["Mixed Sucuk Tost", "Karışık Sucuklu Tost"], "$15.90", "mixed-sucuk-tost", ["Turkish sucuk, cheese, fries, ketchup, mayonnaise and butter.", "Sucuk, peynir, patates kızartması, ketçap, mayonez ve tereyağı."]),
          ],
        },
      ],
    },

    {
      id: "grill",
      title: ["Grill", "Izgara"],
      tag: ["Fire-kissed", "Ateşten"],
      carousel: ["Huqqa Mix Kebab", "Adana Kebab", "Chicken Shish Kebab", "Lamb Chops"],
      layout: "grid",
      note: ["Add-ons: Adana skewer +$12 · chicken (2) +$7 · köfte (2) +$7 · lamb chop +$5",
             "Ekstralar: Adana şiş +$12 · tavuk (2) +$7 · köfte (2) +$7 · kuzu pirzola +$5"],
      groups: [
        {
          items: [
            i(["Huqqa Mix Kebab", "Huqqa Karışık Kebap"], "$46.99", "huqqa-mix-kebap", ["Adana skewer, chicken, köfte and lamb chops, served with bulgur, rice and house salad.", "Adana şiş, tavuk, köfte ve kuzu pirzola; bulgur, pilav ve mevsim salata ile."]),
            i(["Chicken Shish Kebab", "Tavuk Şiş"], "$19.50", "chicken-shish-kebab", ["Marinated chicken skewers, served with rice, house salad and bread.", "Marine tavuk şiş; pilav, mevsim salata ve ekmek ile."], null, "100%"),
            i(["Chicken Shawarma", "Tavuk Shawarma"], "$19.50", "chicken-shawarma", ["Sliced marinated shawarma chicken, served with rice, house salad and bread.", "Dilimlenmiş marine shawarma tavuk; pilav, mevsim salata ve ekmek ile."], null, "0%"),
            i(["Köfte Kebab", "Izgara Köfte"], "$21.99", "kofte-kabab", ["Five grilled beef patties with onions and spices, served with rice, house salad and bread.", "Soğan ve baharatlı beş adet ızgara köfte; pilav, mevsim salata ve ekmek ile."], null, "0%"),
            i(["Chicken and Köfte Mix", "Tavuk ve Köfte Karışık"], "$25.99", "chicken-kofte-mix", ["Two chicken skewers and three köfte, served with rice, house salad and bread.", "İki tavuk şiş ve üç köfte; pilav, mevsim salata ve ekmek ile."], null, "100%"),
            i(["Beyti Kebab", "Beyti Kebap"], "$25.99", "beyti-kebab", ["Ground beef and lamb wrapped in lavash, topped with tomato sauce and yogurt.", "Lavaşa sarılı dana ve kuzu kıyma, domates sosu ve yoğurt ile."], null, "0%"),
            i(["Lamb Chops", "Kuzu Pirzola"], "$39.99", "lamb-chops", ["Four grilled marinated lamb chops, served with rice, house salad and bread.", "Dört adet marine ızgara kuzu pirzola; pilav, mevsim salata ve ekmek ile."], null, "0%"),
            i(["Liver Shish Kebab", "Ciğer Şiş"], "$22.99", "liver-shish-kabab", ["Marinated liver skewers, served with bulgur, onions, parsley and tomatoes.", "Marine ciğer şiş; bulgur, soğan, maydanoz ve domates ile."], null, "0%"),
            i(["Adana Kebab", "Adana Kebap"], "$23.99", "adana-kabab", ["Ground beef and lamb with red pepper and spices on a skewer, with bulgur and house salad.", "Kırmızı biber ve baharatlı dana-kuzu kıyma şiş; bulgur ve mevsim salata ile."], null, "0%"),
          ],
        },
      ],
    },

    {
      id: "pasta",
      title: ["Pasta & Mantı", "Makarna & Mantı"],
      tabTitle: ["Pasta & Mantı", "Makarna"],
      tag: ["Italian and Turkish", "İtalyan ve Türk"],
      layout: "grid",
      groups: [
        {
          note: ["Add chicken +$7 · add köfte +$7 to any pasta", "Makarnalara tavuk +$7 · köfte +$7"],
          items: [
            i(["Chicken Alfredo", "Tavuklu Alfredo"], "$17.90", "chicken-alfredo", ["Fettuccine with grilled chicken and Alfredo sauce.", "Izgara tavuklu ve Alfredo soslu fettuccine."]),
            v(i(["Penne Arrabbiata", "Penne Arrabbiata"], "$15.90", "penne-arrabbiata", ["Penne with tomatoes, peppers, garlic, spices and parsley.", "Domates, biber, sarımsak, baharat ve maydanozlu penne."])),
            i(["Mantı", "Mantı"], "$18.90", "manti", ["Turkish dumplings filled with seasoned ground beef, topped with garlic yogurt and spiced butter.", "Baharatlı kıyma dolgulu mantı, sarımsaklı yoğurt ve tereyağlı sos ile."]),
          ],
        },
      ],
    },

    {
      id: "sides",
      title: ["Sides", "Yan Ürünler"],
      tag: ["Extras", "Ekstralar"],
      layout: "plain",
      groups: [
        {
          items: [
            v(i(["Rice", "Pilav"], "$5.00")),
            i(["Plain Yogurt", "Yoğurt"], "$5.00"),
            i(["Pickles", "Turşu"], "$5.00"),
            i(["Extra Bread", "Ekstra Ekmek"], "$1.50"),
          ],
        },
      ],
    },

    {
      id: "oven",
      title: ["Oven", "Fırın"],
      tag: ["Pide, lahmacun and pizza", "Pide, lahmacun ve pizza"],
      carousel: ["Lahmacun", "Huqqa Mixed Pizza", "Steak and Cheese Stuffed Pide"],
      layout: "grid",
      groups: [
        {
          title: ["Pide and lahmacun", "Pide ve lahmacun"],
          items: [
            i(["Lahmacun", "Lahmacun"], "$13.90", "lahmacun", ["Crispy thin flatbread with seasoned ground meat and vegetables.", "Baharatlı kıyma ve sebzeli çıtır ince hamur."]),
            i(["Steak and Cheese Stuffed Pide", "Etli Kaşarlı Kapalı Pide"], "$20.90", "steak-and-cheese-stuffed-pide", ["Turkish flatbread stuffed with sliced steak and melted cheese.", "Dilim et ve eritilmiş peynirle doldurulmuş pide."]),
            i(["Ground Beef and Cheese Pide", "Kıymalı Kaşarlı Pide"], "$19.90", "ground-beef-and-cheese-pide", ["Turkish flatbread with seasoned ground beef and melted cheese.", "Baharatlı kıyma ve eritilmiş peynirli pide."]),
            i(["Diced Beef and Cheese Pide", "Kuşbaşılı Kaşarlı Pide"], "$20.90", "diced-beef-and-cheese-pide", ["Turkish flatbread with diced beef and melted cheese.", "Kuşbaşı et ve eritilmiş peynirli pide."]),
            i(["Sucuk and Cheese Pide", "Sucuklu Kaşarlı Pide"], "$18.90", "sucuk-and-cheese-pide", ["Turkish flatbread with sliced sucuk and melted cheese.", "Dilim sucuk ve eritilmiş peynirli pide."]),
            v(i(["Cheese Pide", "Kaşarlı Pide"], "$15.90", "cheese-pide", ["Turkish flatbread with melted cheese.", "Eritilmiş peynirli pide."])),
          ],
        },
        {
          title: ["Pizza", "Pizza"],
          items: [
            v(i(["Cheese Pizza", "Peynirli Pizza"], "$17.90", "cheese-pizza", ["Pizza sauce and cheese.", "Pizza sosu ve peynir."])),
            i(["Huqqa Mixed Pizza", "Huqqa Karışık Pizza"], "$22.90", "huqqa-mixed-pizza", ["Sucuk, sausage, green peppers, mushrooms, tomatoes, corn, olives and cheese.", "Sucuk, sosis, yeşil biber, mantar, domates, mısır, zeytin ve peynir."]),
            i(["Steak and Cheese Pizza", "Etli Peynirli Pizza"], "$23.90", "steak-and-cheese-pizza", ["Pizza sauce, sliced steak, green peppers, onions, mushrooms and cheese.", "Pizza sosu, dilim et, yeşil biber, soğan, mantar ve peynir."]),
          ],
        },
      ],
    },

    {
      id: "desserts",
      title: ["Desserts", "Tatlılar"],
      tag: ["Sweet", "Tatlı kaçamak"],
      carousel: ["Künefe", "Baklava", "Katmer with Ice Cream"],
      layout: "grid",
      groups: [
        {
          note: ["Add kaymak +$2 · small ice cream +$3 · large ice cream +$6", "Kaymak +$2 · küçük dondurma +$3 · büyük dondurma +$6"],
          items: [
            i(["Künefe", "Künefe"], "$12.99", "kunefe", ["Shredded pastry and melted cheese, baked golden and topped with hot syrup.", "Tel kadayıf ve eriyen peynir, fırında kızartılıp sıcak şerbetle."]),
            i(["Baklava", "Baklava"], "$7.99", "baklava", ["Crispy layers of pastry, crushed pistachio and syrup.", "Çıtır kat kat yufka, fıstık ve şerbet."]),
            i(["Cold Baklava", "Soğuk Baklava"], "$8.99", "cold-baklava", ["Thin pastry, crushed pistachio and sweetened cold milk.", "İnce yufka, fıstık ve şekerli soğuk süt."]),
            i(["Diyarbakır Burma", "Diyarbakır Burma"], "$8.99", "diyarbakir-burma", ["Thin shredded pastry, pistachio, melted butter and syrup.", "İnce tel kadayıf, fıstık, tereyağı ve şerbet."]),
            i(["Katmer with Ice Cream", "Dondurmalı Katmer"], "$9.99", "katmer-with-ice-cream", ["Thin dough filled with pistachio, sugar, cream and Nutella.", "Fıstık, şeker, kaymak ve Nutella dolgulu ince hamur."]),
            i(["Ekmek Kadayıf", "Ekmek Kadayıfı"], "$11.99", "ekmek-kadayif", ["Bread dough soaked in syrup, served with clotted cream.", "Şerbetli ekmek kadayıfı, kaymak ile."]),
            i(["Tres Leches", "Tres Leches"], "$9.99", "tres-leches", ["Sponge cake soaked in three kinds of milk.", "Üç çeşit sütle ıslatılmış pandispanya."]),
            i(["Chocolate Soufflé with Ice Cream", "Dondurmalı Çikolatalı Sufle"], "$10.99", "chocolate-souffle-with-ice-cream", ["Rich chocolate dessert served warm with ice cream.", "Sıcak servis edilen yoğun çikolatalı tatlı, dondurma ile."]),
            i(["Rice Pudding", "Sütlaç"], "$8.99", "rice-pudding", ["Creamy pudding made from rice and milk.", "Pirinç ve sütle yapılan kremamsı tatlı."]),
            i(["Kazandibi", "Kazandibi"], "$9.99", "kazandibi", ["Caramelized milk pudding with a burnt bottom.", "Altı yakılmış karamelize süt tatlısı."]),
            i(["Profiterole", "Profiterol"], "$9.99", "profiterole", ["Cream-filled choux puffs with chocolate sauce.", "Krema dolgulu ekler hamuru, çikolata sosuyla."]),
            i(["Tiramisu", "Tiramisu"], "$8.99", "tiramisu", ["Coffee-soaked ladyfingers, mascarpone cream and cocoa.", "Kahveye batırılmış kedi dili, mascarpone kreması ve kakao."]),
            i(["Cheesecake", "Cheesecake"], "$8.99", "cheesecake", ["Classic creamy cheesecake.", "Klasik kremalı cheesecake."]),
          ],
        },
      ],
    },

    // Drinks: one card per drink, options (served hot/iced, flavor, size) inside its details bar.
    // d(name, price, photo, opts). opts.v maps the chosen options to a photo slug: the key is
    // "Iced" (when served iced) plus the English flavor/size name, e.g. "Iced Vanilla". opts.focus works as in Grill.
    {
      id: "drinks",
      title: ["Drinks", "İçecekler"],
      tag: ["Hot and cold", "Sıcak ve soğuk"],
      layout: "drinks",
      hero: {
        kicker: ["House signature", "Evin klasiği"],
        title: ["Turkish Tea", "Türk Çayı"],
        tiles: [
          { name: ["Tea Pot", "Demlik"], search: ["Turkish Tea Pot", "Demlik Çay"], price: "$19.99", img: "turkish-tea-pot",
            plus: ["Flavored +$1", "Aromalı +$1"],
            more: d(["Flavored Tea Pot", "Aromalı Demlik Çay"], "$20.99", null,
              { note: ["The Tea Pot with a flavored tea instead, $1 extra.", "Demlik, aromalı çay ile; $1 fark."], flavors: TEAS }) },
          { name: ["Small Pot", "Küçük Demlik"], search: ["Small Turkish Tea Pot", "Küçük Demlik Çay"], price: "$14.99", img: "small-turkish-tea-pot" },
          { name: ["Glass", "Bardak"], search: ["Turkish Tea Glass", "Bardak Çay"], price: "$2.99", img: "turkish-tea-glass" },
          // Full-width strip under the three tea tiles.
          { name: ["Flavored Tea", "Bitki Çayı"], sub: ["Mug", "Kupa"], price: "$4.90", img: "flavored-tea", wide: true,
            more: d(["Flavored Tea", "Bitki Çayı"], "$4.90", null,
              { note: ["By the mug. A pot of flavored tea is $20.99.", "Kupa. Aromalı demlik $20.99."], flavors: TEAS }) },
        ],
      },
      groups: [
        {
          items: [
            d(["Turkish Coffee", "Türk Kahvesi"], "$6.50", "turkish-coffee"),
          ],
        },
        {
          title: ["Espresso bar", "Espresso bar"],
          items: [
            d(["Latte", "Latte"], "$8.50", "latte-vanilla", {
              temps: true, flavors: SYRUPS,
              v: variants(["Vanilla", "Caramel", "Hazelnut", "Nutella"], "latte-", "iced-latte-") }),
            d(["Macchiato", "Macchiato"], "$8.50", "caramel-macchiato", {
              temps: true, flavors: [["Caramel", "Karamel"]],
              v: { "Caramel": "caramel-macchiato", "Iced Caramel": "iced-caramel-macchiato" } }),
            d(["Mocha", "Mocha"], "$8.50", "mocha", { temps: true, v: { "": "mocha", "Iced": "iced-mocha" } }),
            d(["Cappuccino", "Cappuccino"], "$7.90", "cappuccino"),
            d(["Espresso", "Espresso"], "$4.90 / $5.90", "espresso-single", {
              sizes: [[["Single", "Tek"], "$4.90"], [["Double", "Duble"], "$5.90"]],
              v: { "Single": "espresso-single", "Double": "espresso-double" } }),
            d(["Americano", "Americano"], "$5.90", "americano"),
            d(["Nescafe", "Nescafe"], "$5.50", "nescafe"),
            d(["Hot Chocolate", "Sıcak Çikolata"], "$7.90", "hot-chocolate"),
          ],
        },
        {
          title: ["Fresh and blended", "Taze ve blend"],
          rail: true,
          items: [
            d(["Fresh Squeezed Lemonade", "Taze Limonata"], "$9.90", "fresh-squeezed-lemonade"),
            d(["Fresh Orange Juice", "Taze Portakal Suyu"], "$9.90", "fresh-orange-juice"),
            d(["Smoothie", "Smoothie"], "$8.90", "smoothie-mango", {
              flavors: [["Mango", "Mango"], ["Peach", "Şeftali"], ["Strawberry", "Çilek"], ["Banana", "Muz"], ["Lemon Mint", "Limon Nane"], ["Coffee", "Kahve"]],
              v: variants(["Mango", "Peach", "Strawberry", "Banana", "Lemon Mint", "Coffee"], "smoothie-") }),
            d(["Milkshake", "Milkshake"], "$10.90", "milkshake-oreo", {
              flavors: [["Oreo", "Oreo"], ["Nutella", "Nutella"], ["Chocolate", "Çikolata"], ["Strawberry", "Çilek"], ["Vanilla", "Vanilya"]],
              v: variants(["Oreo", "Nutella", "Chocolate", "Strawberry", "Vanilla"], "milkshake-") }),
            d(["Mocktail", "Mocktail"], "$9.90", "mocktail-strawberry-kiss", {
              flavors: [["Strawberry Kiss", "Strawberry Kiss"], ["Mango Melody", "Mango Melody"], ["Citrus Breeze", "Citrus Breeze"]],
              v: variants(["Strawberry Kiss", "Mango Melody", "Citrus Breeze"], "mocktail-") }),
          ],
        },
        {
          title: ["Signature zero-proof", "Özel alkolsüz kokteyller"],
          rail: true,
          items: [
            d(["Mojito", "Mojito"], "$11.95", "mojito", { desc: ["Lime, fresh mint.", "Misket limonu, taze nane."] }),
            d(["Matcha", "Matcha"], "$11.95", "matcha", { desc: ["Matcha tea, celery stalk, lemon.", "Matcha çayı, kereviz sapı, limon."] }),
            d(["Pome Coco", "Pome Coco"], "$11.95", "pome-coco", { desc: ["Pomegranate, coconut cordial, lemon, chocolate tincture.", "Nar, hindistan cevizi şurubu, limon, çikolata esansı."] }),
            d(["Tropical Martini", "Tropical Martini"], "$11.95", "tropical-martini", { desc: ["Mango, passion fruit, pineapple, sea salt.", "Mango, çarkıfelek, ananas, deniz tuzu."] }),
            d(["Chili Passion", "Chili Passion"], "$11.95", "chili-passion", { desc: ["Passion fruit, orange, lemon, chili pepper.", "Çarkıfelek, portakal, limon, acı biber."] }),
            d(["Margarita", "Margarita"], "$11.95", "margarita", { desc: ["Lime, agave, sea salt. Alcohol-free.", "Misket limonu, agave, deniz tuzu. Alkolsüz."] }),
            d(["Satsuma Sorrel", "Satsuma Sorrel"], "$11.95", "satsuma-sorrel", { desc: ["Satsuma, lemon, sorrel, green apple.", "Satsuma mandalina, limon, kuzukulağı, yeşil elma."] }),
            d(["Berry Berry", "Berry Berry"], "$11.95", "berry-berry", { desc: ["Raspberry, blackberry, blueberry, wild strawberry.", "Ahududu, böğürtlen, yaban mersini, yaban çileği."] }),
          ],
        },
        {
          title: ["Classics", "Klasikler"],
          rail: true,
          items: [
            d(["Ayran", "Ayran"], "$4.90", null, { desc: ["Bottled.", "Şişe."] }), // photo pending: needs a bottled ayran shot
            d(["Turkish Gazoz", "Gazoz"], "$3.90", "turkish-gazoz"),
            d(["Can Sodas", "Kutu İçecekler"], "$3.25", "can-sodas"),
            d(["Red Bull", "Red Bull"], "$4.90", "redbull", { flavors: [["Original", "Klasik"], ["Sugar Free", "Şekersiz"]] }),
          ],
        },
      ],
    },

    {
      id: "hookah",
      title: ["Hookah", "Nargile"],
      tag: ["Premium blends", "Premium karışımlar"],
      layout: "hookah",
      // {21} is drawn as the gold "21+" badge.
      age: ["Hookah is served to {21} guests only. We may ask to see ID before serving.", "Nargile yalnızca {21} misafirlere servis edilir. Servisten önce kimlik sorabiliriz."],
      // Brand buttons next to the title; tapping one greys out the other brands' flavors.
      brandFilter: ["Al Fakher", "Adalya", "Starbuzz"],
      // Hookah tiers (not refills) are discounted from opening until 4 PM, Virginia time;
      // each tier sets its own hhDiscount.
      // Opening hour by weekday (0 = Sunday): 11 AM, except Saturday and Sunday at 9 AM.
      happyHour: {
        opens: [9, 11, 11, 11, 11, 11, 9],
        until: 16,
        title: ["Happy hour", "Happy hour"],
        now: ["$6 off Classic · $7 off Premium hookahs", "Klasik nargilede $6 · Premium nargilede $7 indirim"],
        endsIn: ["Ends at 4 PM · {t} left", "Saat 16:00'da bitiyor · {t} kaldı"],
        endsAt: ["Ends at 4 PM", "Saat 16:00'da bitiyor"],
        note: ["Happy hour every day from opening until 4 PM: $6 off Classic and $7 off Premium hookahs. Refills not included.",
               "Her gün açılıştan saat 16:00'ya kadar happy hour: Klasik nargilede $6, Premium nargilede $7 indirim. Kafa değişimi hariç."],
      },
      tiers: [
        {
          title: ["Classic Flavors", "Klasik Aromalar"],
          price: "$24.90",
          hhDiscount: 6,
          brand: "Al Fakher",
          flavors: ["Double Apple", "Double Apple Mint", "Mint", "Orange", "Orange Mint", "Gum Mint", "Grape", "Grape Mint",
            "Grapefruit Mint", "Lemon Mint", "Citrus Mint", "Watermelon", "Watermelon Mint", "Gum and Cinnamon",
            "Blueberry Mint", "Peach", "Peach Mint", "Cappuccino", "Berry Mix", "Rose"],
        },
        {
          title: ["Premium Flavors", "Premium Aromalar"],
          price: "$26.90",
          hhDiscount: 7,
          flavors: ["Blue Mist", "Blue Mist Mint", "Pink", "Tropicool", "Tropicool Mint", "Code 69", "Exotic Strawberry Daiquiri",
            "Citrus Mist", "Melon Blue", "Safari Melon Dew", "Irish Peach", "Sex on the Beach", "White Peach", "Skyfall",
            "Love 66", "Lady Killer", "Baku Nights", "Berlin Nights", "Mi Amor", "Pan"],
          // Brand per flavor (Claude's assignment; Tropicool and Pan unverified).
          brandOf: {
            Starbuzz: ["Blue Mist", "Blue Mist Mint", "Pink", "Code 69", "Exotic Strawberry Daiquiri", "Citrus Mist",
              "Melon Blue", "Safari Melon Dew", "Irish Peach", "Sex on the Beach", "White Peach"],
            Adalya: ["Tropicool", "Tropicool Mint", "Skyfall", "Love 66", "Lady Killer", "Baku Nights", "Berlin Nights",
              "Mi Amor", "Pan"],
          },
        },
      ],
      groups: [
        {
          title: ["Refills", "Kafa değişimi"],
          items: [
            { ...i(["Classic Refill", "Klasik Kafa"], "$12.90", null), brands: ["Al Fakher"] },
            { ...i(["Premium Refill", "Premium Kafa"], "$13.90", null), brands: ["Starbuzz", "Adalya"] },
          ],
        },
      ],
    },
  ],

  // Shown under the halal line and the V legend.
  allergy: ["Our food may contain milk, eggs, wheat, soybean, tree nuts, peanuts, sesame or fish. Please tell your server about any allergies.",
    "Yemeklerimiz süt, yumurta, buğday, soya, sert kabuklu yemiş, yer fıstığı, susam veya balık içerebilir. Alerjiniz varsa lütfen garsonunuza bildirin."],

  notices: [
    ["Our food menu is 100% halal.", "Yemek menümüz %100 helaldir."],
    ["Consuming raw or undercooked meats, poultry, seafood or eggs may increase your risk of food-borne illness.",
     "Çiğ veya az pişmiş et, tavuk, deniz ürünü ya da yumurta tüketmek gıda kaynaklı hastalık riskini artırabilir."],
    ["18% gratuity may be added for parties of 3 or more. $25 minimum spend per person.",
     "3 kişi ve üzeri gruplara %18 servis ücreti eklenebilir. Kişi başı minimum harcama $25."],
    ["Prices and items are subject to change without notice.", "Fiyatlar ve ürünler önceden haber verilmeksizin değişebilir."],
  ],
};
