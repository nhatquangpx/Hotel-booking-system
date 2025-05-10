import Navbar from "../components/Navbar"
import Slide from "../components/Slide"
import Categories from "../components/Categories"

const HomePage = () => {
  console.log("HomePage rendering");
  return (
    <>
       <Navbar/>
       <Slide/>
       <Categories/>
    </>
  )
}

export default HomePage