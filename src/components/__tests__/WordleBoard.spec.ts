import { mount } from '@vue/test-utils'
import WordleBoard from "../WordleBoard.vue";
import { MAX_GUESSES_COUNT, VICTORY_MESSAGE, WORD_SIZE, WRONG_GUESS_MESSAGE } from '@/settings'
import GuessView from '../GuessView.vue';

describe('WordleBoard', () => {
  let wordOfTheDay = "TESTS"
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    wrapper = mount(WordleBoard, { props: { wordOfTheDay } })
  })

  async function playerTypesGuess(guess: string) {
    await wrapper.find("input[type=text]").setValue(guess);
  }

  // async function playerPressesEnter() {
  //   await wrapper.find("input[type=text]").trigger("keydown.enter");
  // }

  async function playerTypesAndSubmitsGuess(guess: string) {
    await playerTypesGuess(guess)
    // await playerPressesEnter()
  }

  describe("End of game messages", () => {
    test("A victory message appears when the user makes a guess that matches the word of the day", async () => {
      await playerTypesAndSubmitsGuess(wordOfTheDay)

      expect(wrapper.text()).toContain(VICTORY_MESSAGE)
    })

    describe.each(
      Array.from({ length: MAX_GUESSES_COUNT + 1 },
        (_, numberOfGuesses) => ({
          numberOfGuesses,
          shouldSeeDefeatMessage: numberOfGuesses === MAX_GUESSES_COUNT
        }))
    )("A defeat message should appear if the player meakes incorrect guesses 6 times in a row", ({ numberOfGuesses, shouldSeeDefeatMessage }) => {
      test.skip(`therefore for ${numberOfGuesses} guess(es), a defeat message should ${shouldSeeDefeatMessage ? "" : "not"} appear`, async () => {
        for (let i = 0; i < MAX_GUESSES_COUNT; i++) {
          await playerTypesAndSubmitsGuess("WRONG")
        }

        if (shouldSeeDefeatMessage) {
          expect(wrapper.text()).toContain(WRONG_GUESS_MESSAGE)
        } else {
          expect(wrapper.text()).not.toContain(WRONG_GUESS_MESSAGE)
        }
      })
    })

    test("no end-of-game message appears if the user has not yet made a guess", async () => {
      expect(wrapper.text()).not.toContain(WRONG_GUESS_MESSAGE)
      expect(wrapper.text()).not.toContain(VICTORY_MESSAGE)
    })
  })

  describe("Rules for defining the word of the day", () => {
    beforeEach(() => {
      console.warn = vi.fn()
    })
    test.each(
      [
        { wordOfTheDay: "FLY", failureReason: "doesnt'have 5 letters" },
        { wordOfTheDay: "words", failureReason: "is not all uppercase" },
        { wordOfTheDay: "AXXUR", failureReason: "doesn't exist in English" }
      ]
    )("Given the word $wordOfTheDay, which $failureReason, a warning is emitted", async ({ wordOfTheDay }) => {
      mount(WordleBoard, { props: { wordOfTheDay } })

      expect(console.warn).toHaveBeenCalled()
    })

    test.skip("If a real uppercase English word with 5 characters is provided, no warning is emited", async () => {
      mount(WordleBoard, { props: { wordOfTheDay: "TESTS" } })

      expect(console.warn).not.toHaveBeenCalled()
    })
  })

  describe("Player input view", () => {
    test("Five empty boxes appears with the inital guess", async () => {

    })
  })

  describe(`There should always be exactly ${MAX_GUESSES_COUNT} guess-views in the board`, () => {
    test(`${MAX_GUESSES_COUNT} guess-views are present at the start of the game`, async () => {
      expect(wrapper.findAllComponents(GuessView)).toHaveLength(MAX_GUESSES_COUNT)
    })

    test(`${MAX_GUESSES_COUNT + 1} guess-views are present when the player wins the game`, async () => {
      await playerTypesAndSubmitsGuess(wordOfTheDay)

      expect(wrapper.findAllComponents(GuessView)).toHaveLength(MAX_GUESSES_COUNT + 1)
    })
  })

  describe("Player input", () => {
    test("Word of the day text input remains focus during all the game", async () => {
      document.body.innerHTML = `<div id="app"></div>`
      wrapper = mount(WordleBoard, {
        props: { wordOfTheDay },
        attachTo: "#app"
      })
      expect(wrapper.find("input[type=text]").attributes("autofocus")).not.toBeUndefined()

      await wrapper.find("input[type=text]").trigger("blur")
      expect(document.activeElement).toBe(wrapper.find("input[type=text]").element)
    })

    test("the input gets cleared afeter each submission", async () => {
      await playerTypesAndSubmitsGuess("WRONG")

      expect(wrapper.find<HTMLInputElement>("input[type=text]").element.value).toEqual("")
    })

    test(`player guesses are lmited to ${WORD_SIZE} letters`, async () => {
      await playerTypesAndSubmitsGuess(wordOfTheDay + "EXTRA")

      expect(wrapper.text()).toContain(VICTORY_MESSAGE)
    })

    test("player guesses can only be submitted if they are real words", async () => {
      await playerTypesAndSubmitsGuess("QWERT")

      expect(wrapper.text()).not.toContain(VICTORY_MESSAGE)
      expect(wrapper.text()).not.toContain(WRONG_GUESS_MESSAGE)
    })
    test("player guesses are not case-sensitive", async () => {
      await playerTypesAndSubmitsGuess(wordOfTheDay.toLowerCase())

      expect(wrapper.text()).toContain(VICTORY_MESSAGE)
    })

    test("player guesses can only contain letters", async () => {
      await playerTypesGuess("H3!RT")

      expect(wrapper.find<HTMLInputElement>('input[type=text]').element.value).toEqual('HRT')
    })

    test.skip("non-letter characters do not render on the screen while being typed", async () => {
      await playerTypesGuess("333")
      await playerTypesGuess("3333")

      expect(wrapper.find<HTMLInputElement>('input[type=text]').element.value).toEqual('')
    })

    test("the players loses control after the max amount of guesses have been sent", async () => {
      const guesses = [
        "WRONG",
        "GUESS",
        "HELLO",
        "WORLD",
        "HAPPY",
        "CODER"
      ]

      for (const guess of guesses) {
        await playerTypesAndSubmitsGuess(guess)
      }

      expect(wrapper.find("input[type=text]").attributes("disabled")).not.toBeUndefined()
    })

    test("The player loses control after the correct guess has been given", async () => {
      await playerTypesAndSubmitsGuess(wordOfTheDay)

      expect(wrapper.find("input[type=text]").attributes("disabled")).not.toBeUndefined()
    })

    test("The player can't enter one guess more than one time", async () => {
      await playerTypesAndSubmitsGuess("FIRST")
      await playerTypesAndSubmitsGuess("FIRST")

      const componentsWithoutWords = wrapper.findAllComponents(GuessView).filter( view => view.element.textContent?.trim() !== "")
      expect(componentsWithoutWords.length).toBe(1)
    })
  })

  test("All previous guesses done by the player are visible in the page", async () => {
    const guesses = [
      "WRONG",
      "GUESS",
      "HELLO",
      "WORLD",
      "HAPPY",
      "CODER"
    ]

    for (const guess of guesses) {
      await playerTypesAndSubmitsGuess(guess)
    }

    for (const guess of guesses) {
      expect(wrapper.text()).toContain(guess)
    }
    console.log("acaa", wrapper.text())


  })

  describe("Display hints/feedback to the player", () => {
    test.skip("Hints are not displayed until the player sumbits thier guess", async () => {
      expect(wrapper.find("[data-letter-feedback]").exists(), "Feedback was being rendered before the player started typing").toBe(false)
      
      await playerTypesGuess(wordOfTheDay)
      expect(wrapper.find("[data-letter-feedback]").exists(), "Feedback was being rendered while the player was typing their guess").toBe(false)
      
      // await playerPressesEnter()
      expect(wrapper.find("[data-letter-feedback]").exists(), "Feedback was being rendered while the player was typing their guess").toBe(true)
    })
  })

  describe.each([
    {
      position: 0,
      expectedFeedback: "correct",
      reason: "W is the first letter of 'WORLD' and 'WRONG'"
    },
    {
      position: 1,
      expectedFeedback: "almost",
      reason: "R exists in both words, but it is in position '2' of WORLD"
    },
    {
      position: 2,
      expectedFeedback: "almost",
      reason: "O exists in both words, but it is in position '1' of WORLD"
    },
    {
      position: 3,
      expectedFeedback: "incorrect",
      reason: "N does not exist in 'WORLD'"
    },
    {
      position: 4,
      expectedFeedback: "incorrect",
      reason: "G does not exist in 'WORLD'"
    }
  ])("Given the word of day 'WORLD' and the player types 'WRONG'", ({position, expectedFeedback, reason}) => {
    const wordOfTheDay = "WORLD"
    const playerGuess = "WRONG"

    test(`the feedback for '${playerGuess[position]}' (index: ${position}) should be '${expectedFeedback} becasuse '${reason}'`, async () => {
      wrapper = mount(WordleBoard, {propsData: {wordOfTheDay}})

      await playerTypesAndSubmitsGuess(playerGuess)

      const actualFeedback = wrapper.findAll("[data-letter]").at(position)?.attributes("data-letter-feedback")

      expect(actualFeedback).toEqual(expectedFeedback)
    })
  })
})

