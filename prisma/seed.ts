import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const source = await prisma.dataSource.upsert({
    where: { url: "https://www.serebii.net/pokemonchampions/pokemon.shtml" },
    update: {
      name: "Serebii Pokemon Champions available roster",
      publisher: "Serebii.net",
      isOfficial: false,
      notes: "Community-maintained current roster reference; competitive records remain separately unverified.",
    },
    create: {
      name: "Serebii Pokemon Champions available roster",
      url: "https://www.serebii.net/pokemonchampions/pokemon.shtml",
      publisher: "Serebii.net",
      notes: "Community-maintained current roster reference; competitive records remain separately unverified.",
    },
  });

  await prisma.dataVerification.deleteMany({
    where: { source: { url: "https://example.invalid/local-development-seed" } },
  });
  await prisma.pokemon.deleteMany({ where: { slug: { startsWith: "demo-" } } });
  await prisma.dataSource.deleteMany({ where: { url: "https://example.invalid/local-development-seed" } });

  const pokemon = await Promise.all(
    [
      "0003|Venusaur", "0006|Charizard", "0009|Blastoise", "0015|Beedrill", "0018|Pidgeot", "0024|Arbok", "0025|Pikachu", "0026|Raichu", "0036|Clefable", "0038|Ninetales", "0040|Wigglytuff", "0045|Vileplume", "0053|Persian", "0059|Arcanine", "0065|Alakazam", "0068|Machamp", "0071|Victreebel", "0080|Slowbro", "0083|Farfetch'd", "0094|Gengar", "0115|Kangaskhan", "0121|Starmie", "0122|Mr. Mime", "0127|Pinsir", "0128|Tauros", "0130|Gyarados", "0132|Ditto", "0134|Vaporeon", "0135|Jolteon", "0136|Flareon", "0142|Aerodactyl", "0143|Snorlax", "0149|Dragonite", "0154|Meganium", "0157|Typhlosion", "0160|Feraligatr", "0168|Ariados", "0181|Ampharos", "0184|Azumarill", "0186|Politoed", "0196|Espeon", "0197|Umbreon", "0199|Slowking", "0205|Forretress", "0208|Steelix", "0211|Qwilfish", "0212|Scizor", "0214|Heracross", "0227|Skarmory", "0229|Houndoom", "0248|Tyranitar", "0254|Sceptile", "0257|Blaziken", "0260|Swampert", "0279|Pelipper", "0282|Gardevoir", "0302|Sableye", "0303|Mawile", "0306|Aggron", "0308|Medicham", "0310|Manectric", "0317|Swalot", "0319|Sharpedo", "0323|Camerupt", "0324|Torkoal", "0334|Altaria", "0350|Milotic", "0351|Castform", "0354|Banette", "0358|Chimecho", "0359|Absol", "0362|Glalie", "0373|Salamence", "0376|Metagross", "0389|Torterra", "0392|Infernape", "0395|Empoleon", "0398|Staraptor", "0405|Luxray", "0407|Roserade", "0409|Rampardos", "0411|Bastiodon", "0428|Lopunny", "0442|Spiritomb", "0445|Garchomp", "0448|Lucario", "0450|Hippowdon", "0454|Toxicroak", "0460|Abomasnow", "0461|Weavile", "0464|Rhyperior", "0470|Leafeon", "0471|Glaceon", "0472|Gliscor", "0473|Mamoswine", "0475|Gallade", "0478|Froslass", "0479|Rotom", "0497|Serperior", "0500|Emboar", "0503|Samurott", "0505|Watchog", "0510|Liepard", "0512|Simisage", "0514|Simisear", "0516|Simipour", "0518|Musharna", "0530|Excadrill", "0531|Audino", "0534|Conkeldurr", "0545|Scolipede", "0547|Whimsicott", "0553|Krookodile", "0560|Scrafty", "0563|Cofagrigus", "0569|Garbodor", "0571|Zoroark", "0579|Reuniclus", "0584|Vanilluxe", "0587|Emolga", "0604|Eelektross", "0609|Chandelure", "0614|Beartic", "0618|Stunfisk", "0623|Golurk", "0635|Hydreigon", "0637|Volcarona", "0652|Chesnaught", "0655|Delphox", "0658|Greninja", "0660|Diggersby", "0663|Talonflame", "0666|Vivillon", "0668|Pyroar", "0670|Floette", "0671|Florges", "0673|Gogoat", "0675|Pangoro", "0676|Furfrou", "0678|Meowstic", "0681|Aegislash", "0683|Aromatisse", "0685|Slurpuff", "0687|Malamar", "0689|Barbaracle", "0691|Dragalge", "0693|Clawitzer", "0695|Heliolisk", "0697|Tyrantrum", "0699|Aurorus", "0700|Sylveon", "0701|Hawlucha", "0702|Dedenne", "0706|Goodra", "0707|Klefki", "0709|Trevenant", "0711|Gourgeist", "0713|Avalugg", "0715|Noivern", "0724|Decidueye", "0727|Incineroar", "0730|Primarina", "0733|Toucannon", "0740|Crabominable", "0745|Lycanroc", "0748|Toxapex", "0750|Mudsdale", "0752|Araquanid", "0758|Salazzle", "0763|Tsareena", "0765|Oranguru", "0766|Passimian", "0768|Golisopod", "0778|Mimikyu", "0780|Drampa", "0784|Kommo-o", "0812|Rillaboom", "0815|Cinderace", "0818|Inteleon", "0823|Corviknight", "0828|Thievul", "0841|Flapple", "0842|Appletun", "0844|Sandaconda", "0849|Toxtricity", "0853|Grapploct", "0855|Polteageist", "0858|Hatterene", "0861|Grimmsnarl", "0863|Perrserker", "0865|Sirfetch'd", "0866|Mr. Rime", "0867|Runerigus", "0869|Alcremie", "0870|Falinks", "0871|Pincurchin", "0876|Indeedee", "0877|Morpeko", "0887|Dragapult", "0899|Wyrdeer", "0900|Kleavor", "0902|Basculegion", "0903|Sneasler", "0904|Overqwil", "0908|Meowscarada", "0911|Skeledirge", "0914|Quaquaval", "0923|Pawmot", "0925|Maushold", "0930|Arboliva", "0931|Squawkabilly", "0934|Garganacl", "0936|Armarouge", "0937|Ceruledge", "0939|Bellibolt", "0943|Mabosstiff", "0952|Scovillain", "0956|Espathra", "0959|Tinkaton", "0964|Palafin", "0968|Orthworm", "0970|Glimmora", "0972|Houndstone", "0979|Annihilape", "0981|Farigiraf", "0983|Kingambit", "0998|Baxcalibur", "1000|Gholdengo", "1013|Sinistcha", "1018|Archaludon", "1019|Hydrapple",
    ].map((entry) => {
      const [nationalDexNumber, name] = entry.split("|");
      return { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, nationalDexNumber: Number(nationalDexNumber) };
    }).map(({ slug, name, nationalDexNumber }) =>
      prisma.pokemon.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          name,
          nationalDexNumber: Number(nationalDexNumber),
          verificationStatus: "COMMUNITY",
          strengths: [],
          weaknesses: [],
          availability: {
            create: {
              status: "AVAILABLE",
              notes: "Listed in the current Serebii Pokemon Champions available roster.",
            },
          },
        },
      }),
    ),
  );

  for (const record of pokemon) {
    const verification = await prisma.dataVerification.findFirst({
      where: { entityType: "Pokemon", entityId: record.id, sourceId: source.id },
    });

    if (!verification) {
      await prisma.dataVerification.create({
        data: {
          entityType: "Pokemon",
          entityId: record.id,
          sourceId: source.id,
          status: "COMMUNITY",
          notes: "Availability sourced from the community-maintained Champions roster; competitive data remains unverified.",
        },
      });
    }
  }

  console.log(`Seeded ${pokemon.length} development Pokemon records and 1 data source.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());