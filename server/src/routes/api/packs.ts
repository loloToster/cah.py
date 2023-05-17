import { Router } from "express"
import db from "../../modules/db"
import { ApiCardPack, SearchCriteria } from "../../types"
import { getRandomInt } from "../../utils/random"

const router = Router()

router.get("/", async (req, res) => {
  const packs = await db.cardPack.findMany({
    orderBy: { id: "asc" },
    include: {
      type: true,
      bundle: true,
      tags: true,
      _count: {
        select: {
          blackCards: true,
          whiteCards: true,
          likedBy: true
        }
      }
    }
  })

  res.json({
    packs: packs.map(
      p =>
        ({
          id: p.id,
          name: p.name,
          type: p.type,
          bundle: p.bundle,
          color: p.color,
          icon: p.icon,
          tags: p.tags,
          numOfBlacks: p._count.blackCards,
          numOfWhites: p._count.whiteCards,
          likedBy: p._count.likedBy
        } satisfies ApiCardPack)
    )
  })
})

router.get("/search-criteria", async (req, res) => {
  res.json({
    types: await db.cardPackType.findMany(),
    bundles: await db.cardPackBundle.findMany(),
    tags: await db.cardPackTag.findMany()
  } satisfies SearchCriteria)
})

router.get("/random-cards", async (req, res) => {
  const NUM_OF_WHITE = 10
  const NUM_OF_BLACK = 4

  const totalWhiteCards = await db.whiteCard.count()
  const totalBlackCards = await db.blackCard.count()

  const dbWhiteCards = await db.whiteCard.findMany({
    include: { pack: true },
    take: NUM_OF_WHITE,
    skip: getRandomInt(0, totalWhiteCards - NUM_OF_WHITE)
  })

  const dbBlackCards = await db.blackCard.findMany({
    include: { pack: true },
    take: NUM_OF_BLACK,
    skip: getRandomInt(0, totalBlackCards - NUM_OF_BLACK)
  })

  const cards = dbWhiteCards
    .map(c => ({
      id: c.id,
      text: c.text,
      pack: c.pack.name,
      color: "white"
    }))
    .concat(
      dbBlackCards.map(c => ({
        id: c.id,
        text: c.text,
        pack: c.pack.name,
        color: "black"
      }))
    )

  res.json({ cards })
})

export = router
