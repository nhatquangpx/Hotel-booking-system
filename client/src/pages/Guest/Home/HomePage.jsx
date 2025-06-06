import Navbar from "../../../components/User/Navbar/Navbar"
import Slide from "../../../components/User/Slide/Slide"
import Categories from "../../../components/User/Categories/Categories"
import Footer from "../../../components/User/Footer/Footer"
import "./HomePage.scss"

const HomePage = () => {
  console.log("HomePage rendering");
  return (
    <div className="homepage-container">
       <Navbar/>
       <div className="homepage-content">
         <Slide/>
         <Categories/>
       </div>
       <Footer/>
    </div>
  )
}

export default HomePage