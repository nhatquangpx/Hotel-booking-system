import { categories } from '../data'
import "../styles/Categorises.scss"
const Categorises = () => {
  return (
    <div className='catergories'>
        <h1>Chọn Phòng Bạn Cảm Thấy Yêu Thích</h1>
        <p>Khám phá những căn phòng được thiết kế sang trọng, đầy đủ tiện nghi, mang đến cảm giác thoải mái như ở nhà. Chúng tôi cam kết cung cấp dịch vụ chất lượng với đội ngũ nhân viên tận tâm, sẵn sàng hỗ trợ 24/7. Hãy chọn cho mình một không gian lý tưởng và tận hưởng kỳ nghỉ tuyệt vời cùng những tiện ích đẳng cấp.</p>
    
    <div className='catergories_list'>
        {categories?.slice(1, 7).map((category, index)=>{
          <Link to=''>
            <div className ='category' key={index}>
              <img src="category.img" alt='category.label'/>
              <div className="overlay"></div>
              <div className="category_text">
                <div className="category_text_icon">{category.icon}</div>
                <p>{category.label}</p>
              </div>
            </div>
          </Link>
        })}
    </div>
    </div>
  )
}

export default Categorises