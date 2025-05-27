import { categories } from '../../data';
import "./Categories.scss";
import { Link } from 'react-router-dom';

const Categories = () => {
  return (
    <div className='categories'>
      <h1>Lựa Chọn Kiểu Phòng Bạn Muốn</h1>
      <p>
        Khám phá những căn phòng được thiết kế sang trọng, đầy đủ tiện nghi, 
        mang đến cảm giác thoải mái như ở nhà. Chúng tôi cam kết cung cấp dịch 
        vụ chất lượng với đội ngũ nhân viên tận tâm, sẵn sàng hỗ trợ 24/7. Hãy 
        chọn cho mình một không gian lý tưởng và tận hưởng kỳ nghỉ tuyệt vời cùng 
        những tiện ích đẳng cấp.
      </p>

      <div className='categories_list'>
        {categories?.slice(1, 7).map((category, index) => (
          <Link to='' key={index}>
            <div className='category'>
              <img src={category.img} alt={category.label} />
              <div className="overlay"></div>
              <div className="category_text">
                <div className="category_text_icon">{category.icon}</div>
                <p>{category.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;
