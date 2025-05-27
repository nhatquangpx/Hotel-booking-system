import Navbar from "../../components/Navbar/Navbar"
import Slide from "../../components/Slide/Slide"
import Categories from "../../components/Categories/Categories"
import Footer from "../../components/Footer/Footer"

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