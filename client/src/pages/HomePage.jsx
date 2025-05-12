import Navbar from "../components/Navbar"
import Slide from "../components/Slide"
import Categories from "../components/Categories"
import Footer from "../components/Footer"

const HomePage = () => {
  console.log("HomePage rendering");
  return (
    <>
       <Navbar/>
       <Slide/>
       <Categories/>
       <Footer/>
    </>
  )
}

export default HomePage