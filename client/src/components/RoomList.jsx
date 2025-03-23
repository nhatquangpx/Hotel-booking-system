import React from 'react'

const RoomList = () => {
  return (
    <div className='room'>
        <h1>Chọn Phòng Bạn Cảm Thấy Yêu Thích</h1>
        <p>Khám phá những căn phòng được thiết kế sang trọng, đầy đủ tiện nghi, mang đến cảm giác thoải mái như ở nhà. Chúng tôi cam kết cung cấp dịch vụ chất lượng với đội ngũ nhân viên tận tâm, sẵn sàng hỗ trợ 24/7. Hãy chọn cho mình một không gian lý tưởng và tận hưởng kỳ nghỉ tuyệt vời cùng những tiện ích đẳng cấp.</p>
    
    <div className='room_list'>
      {roomlist}

    </div>
    </div>
  )
}

export default RoomList