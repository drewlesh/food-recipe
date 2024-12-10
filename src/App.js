/*
  Run node App.js in the terminal to start server.(through its folder in the directory)
*/

//import "/public/images/filter.png";
import "./styles.css";
import React, { useState, useEffect, useMemo } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { BarChart, Bar, Tooltip, XAxis, YAxis } from "recharts";

export default function App() {
  return (
    <div className="App">
      <About />
      <GetRandomRecipe />
    </div>
  );
}

function About() {
  return (
    <div className="about-container">
      <h1>Random Recipe</h1>
      <p>Discover your next food cravings with the click of a button!</p>
      <p>
        With a wide range of dishes and drinks, they are accompanied by detailed
        instructions, nutritional information and a checklist for groceries.
      </p>
      <p>
        Customize your search by filtering recipes based on the listed diets,
        intolerances, and meal types. Whether you're vegan, gluten-free, or
        simply looking for a quick snack, the search has you covered.
      </p>
      <p>
        Ready to get started? Click the "Random Recipe" button in the
        preferences section!
      </p>
    </div>
  );
}

function GetRandomRecipe() {
  const [diets, setDiets] = useState([]);
  const [intolerances, setIntolerances] = useState([]);
  const [mealType, setMealType] = useState("");

  const [recipe, setRecipe] = useState({});
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [nutrients, setNutrients] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buttonClicked, setButtonClicked] = useState(false);

  const API_KEY = process.env.REACT_APP_API_KEY;

  //https://react.dev/reference/react/useMemo
  let url = useMemo(() => {
    const hasMealType = mealType.length > 0;
    const hasDiet = diets.length > 0;
    const hasIntolerance = intolerances.length > 0;

    // conditional url depends on selected mealtype, diet and intolerances
    const mealTypeQuery = hasMealType ? `&type=${mealType}` : "";
    const dietQuery = hasDiet ? `&diet=${diets.join(",")}` : "";
    const intoleranceQuery = hasIntolerance
      ? `&intolerances=${intolerances.join(",")}`
      : "";

    return `https://api.spoonacular.com/recipes/complexSearch?&number=1&sort=random${mealTypeQuery}${dietQuery}${intoleranceQuery}&apiKey=${API_KEY}`;
  }, [intolerances, diets, mealType]);
  console.log(url);

  //https://builtin.com/software-engineering-perspectives/remove-duplicates-from-array-javascript
  function removeDuplicates(data) {
    return [...new Set(data)];
  }
  // const arr = ["one", "one", "two"];
  // console.log(removeDuplicates(arr));

  //https://dev.to/wanguiwaweru/fetch-api-data-on-button-click-in-react-513i
  async function fetchRecipe() {
    setButtonClicked(false);
    setLoading(true);
    setError(null);

    try {
      const recipeResponse = await fetch(url);
      if (recipeResponse.ok) {
        let data = await recipeResponse.json();
        let recipeId = data.results[0].id;

        let recipeUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`;
        let infoResponse = await fetch(recipeUrl);
        let recipeInfo = await infoResponse.json();

        setRecipe(recipeInfo);
        setIngredients(removeDuplicates(recipeInfo.extendedIngredients));
        setSteps(recipeInfo.analyzedInstructions[0].steps);

        let nutrientsUrl = `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json?apiKey=${API_KEY}`;
        let nutrientsResponse = await fetch(nutrientsUrl);
        let nutrientsData = await nutrientsResponse.json();
        setNutrients(nutrientsData);
        setLoading(false);
      } else {
        console.log("Error while retreiving recipe");
        throw new Error("Error while retreiving recipe");
      }
    } catch (error) {
      setError(error.message);
      Promise.reject(error);
    }
  }
  // console.log("recipe:", recipe);
  // console.log("ingredient:", ingredients);
  // console.log("steps", steps);
  //console.log(nutrients);
  useEffect(() => {
    if (buttonClicked) {
      fetchRecipe();
    }
    // async () =>
    //   // await fetchRecipe().then((recipeInfo) => {
    //   //   setRecipe(recipeInfo);
    //   //   setIngredients(recipeInfo.extendedIngredients);
    //   //   setSteps(recipeInfo.analyzedInstructions[0].steps);
    //   //   setLoading(false);
    //   // });
  }, [buttonClicked]);

  // Handle changes in input boxes and button
  const handleFetch = () => {
    setButtonClicked(true);
  };

  const handleDiets = (e) => {
    setDiets(e);
  };

  const handleIntolerances = (e) => {
    setIntolerances(e);
  };

  const handleMealType = (e) => {
    setMealType(e);
  };

  return (
    <div className="recipe-wrapper">
      <CollapsibleBox title="Preferences">
        <DietFilter
          diets={diets}
          onDietsChange={handleDiets}
          intolerances={intolerances}
          onIntoleranceChange={handleIntolerances}
        />
        <MealTypeFilter mealType={mealType} onMealTypeChange={handleMealType} />
        <button
          className="load-recipe"
          onClick={handleFetch}
          disabled={loading}
        >
          {loading ? "Fetching Recipe..." : "Random Recipe"}
        </button>
      </CollapsibleBox>

      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">Heads Up: {error}</p>}

      <RecipeCard recipe={recipe} />

      <div className="recipe-data">
        <Tabs>
          <TabList>
            <Tab>Ingredients</Tab>
            <Tab>Instructions</Tab>
            <Tab>Grocery List</Tab>
            <Tab>Nutrition Chart</Tab>
          </TabList>

          <TabPanel>
            <h3>Ingredients:</h3>
            <ul className="recipe-ingredients">
              {ingredients.map((ingredient, index) => (
                <li key={index} className="recipe-ingredient">
                  <span className="ingredient-name">{ingredient.name}</span>{" "}
                  <br />
                  {ingredient.amount.toFixed(2)} {ingredient.unit} <hr />
                </li>
              ))}
            </ul>
          </TabPanel>
          <TabPanel>
            <Instructions steps={steps} />
          </TabPanel>

          <TabPanel>
            <GroceryList ingredients={ingredients} />
          </TabPanel>
          <TabPanel>
            <Graph nutrients={nutrients} />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}

//https://www.geeksforgeeks.org/create-a-bar-chart-using-recharts-in-reactjs/
function Graph({ nutrients }) {
  if (Object.keys(nutrients).length === 0) {
    return <p>No data for the graph.</p>;
  }
  const data = nutrients.nutrients.map((nutrient) => ({
    name: `${nutrient.name}(g)`,
    amount: parseInt(nutrient.amount)
  }));
  //console.log(data);

  return (
    <div>
      <h3>Total Calories: {parseInt(nutrients.calories)}</h3>
      <BarChart
        width={800}
        height={400}
        data={data}
        margin={{ top: 10, bottom: 40, left: 10, right: 10 }}
      >
        <Bar dataKey="amount" fill="#e07c24" />
        <XAxis
          dataKey="name"
          angle={-45}
          interval={0}
          textAnchor="end"
          tick={{ fontSize: 8 }}
        />
        <YAxis label={{ value: "Grams", angle: -90, position: "insideLeft" }} />
        <Tooltip />
      </BarChart>
    </div>
  );
}

function RecipeCard(props) {
  const { recipe } = props;
  return (
    <div>
      <h2 className="recipe-title">{recipe.title}</h2>
      <div>
        {recipe.image && (
          <a href={recipe.sourceUrl} target="_blank" rel="noopener norefferer">
            <img src={recipe.image} alt="Recipe" className="recipe-image" />
          </a>
        )}
      </div>
    </div>
  );
}

function MealTypeFilter(props) {
  const { mealType, onMealTypeChange } = props;
  const mealTypes = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "dessert",
    "cocktail",
    "mocktail",
    "drink"
  ];

  const handleMealType = (e) => {
    onMealTypeChange(e.target.value);
  };
  return (
    <div className="mealType">
      <label htmlFor="mealType">Meal Type: </label>
      <select id="mealType" value={mealType} onChange={handleMealType}>
        <option value="">Select</option>

        {mealTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}

function DietFilter(props) {
  const { diets, onDietsChange, intolerances, onIntoleranceChange } = props;

  const commonDiets = [
    "vegan",
    "vegetarian",
    "lacto-vegetarian",
    "ovo-vegetarian",
    "ketogenic",
    "paleo",
    "pescetarian"
  ];

  const commonIntolerances = [
    "dairy",
    "egg",
    "gluten",
    "grain",
    "peanut",
    "seafood",
    "shellfish",
    "sesame",
    "soy",
    "wheat"
  ];

  const handleDietChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      onDietsChange([...diets, value]);
    } else {
      onDietsChange(diets.filter((diet) => diet !== value));
    }
  };

  const handleIntoleranceChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      onIntoleranceChange([...intolerances, value]);
    } else {
      onIntoleranceChange(
        intolerances.filter((intolerance) => intolerance !== value)
      );
    }
  };

  return (
    <div className="filter">
      <div className="diet-wrapper">
        <h3>Dietary:</h3>
        <div className="diet-options">
          {commonDiets.map((diet) => (
            <div className="diet-option" key={diet}>
              <input
                type="checkbox"
                id={diet}
                name={diet}
                value={diet}
                checked={diets.includes(diet)}
                onChange={handleDietChange}
              />
              <label htmlFor={diet}>{diet}</label>
            </div>
          ))}
        </div>
        <h3>Intolerances:</h3>
        <div className="diet-options">
          {commonIntolerances.map((intolerance) => (
            <div className="diet-option" key={intolerance}>
              <input
                type="checkbox"
                id={intolerance}
                name={intolerance}
                value={intolerance}
                checked={intolerances.includes(intolerance)}
                onChange={handleIntoleranceChange}
              />
              <label htmlFor={intolerance}>{intolerance}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Instructions(props) {
  const { steps } = props;
  //console.log(steps);
  return (
    <div className="steps-wrapper">
      <h3>Instructions:</h3>
      <ol className="steps">
        {steps.map((step, index) => (
          <li key={index} className="step">
            {step.step}
          </li>
        ))}
      </ol>
    </div>
  );
}

function GroceryList(props) {
  const { ingredients } = props;
  const [itemsInHand, setItemsInHand] = useState([]);
  const [groceries, setGroceries] = useState(ingredients);

  const handleItemInHandChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      // If the checkbox is checked, add the item to itemsInHand
      setItemsInHand([...itemsInHand, value]);
      // Remove the item from groceries
      setGroceries(groceries.filter((item) => item.name !== value));
    } else {
      // If the checkbox is unchecked, remove the item from itemsInHand
      setItemsInHand(itemsInHand.filter((item) => item !== value));
      // Add the item back to groceries
      setGroceries([
        ...groceries,
        ingredients.find((item) => item.name === value)
      ]);
    }
  };

  // console.log("Already Have:", itemsInHand);
  // console.log("Groceries:", groceries);
  // console.log(ingredients);
  return (
    <div className="grocery-tab">
      <div className="item-options-wrapper">
        <h3>Check List: </h3>
        <div className="item-options">
          {ingredients.map((ingredient, index) => (
            <div className="item-option" key={index}>
              <input
                type="checkbox"
                name={ingredient.name}
                value={ingredient.name}
                checked={itemsInHand.includes(ingredient.name)}
                onChange={handleItemInHandChange}
              />
              <label htmlFor={ingredient.name}>{ingredient.name}</label>
            </div>
          ))}
        </div>
        <div className="grocery-wrapper">
          <h3>Grocery List: </h3>
          <ul className="grocery-list">
            {groceries.map((item, index) => (
              <li key={index} className="grocery-item">
                {item.name}
                <br />
                <span
                  style={{
                    fontStyle: "italic",
                    fontSize: "14px",
                    color: "red"
                  }}
                >
                  ({item.amount} {item.unit})
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

//https://blog.openreplay.com/creating-a-collapsible-component-for-react/
function CollapsibleBox(props) {
  const { title, children } = props;
  const [isOpen, setIsOpen] = useState(true);

  const toggleBox = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="collapsible-box">
      <div className="collapsible-box-header" onClick={toggleBox}>
        <h2>{title}</h2>
        <span>{isOpen ? "-" : "+"}</span>
      </div>
      {isOpen && <div className="collapsible-box-content">{children}</div>}
    </div>
  );
}
