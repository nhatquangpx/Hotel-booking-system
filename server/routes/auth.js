const router = require("express").Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const multer = require("multer")

const User = require('../models/User')

const storage = multer.diskStorage({
    destination: function (req, res, cb) {
        cb(null, "public/uploads/")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage })

/* USER REGISTER */
router.post("/register", upload.none(), async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body //Lay thong tin nguoi dung tu form

        const existingUser = await User.findOne({ email })        //Kiem tra nguoi dung co ton tai bang email
        if (existingUser) {
            return res.status(400).json({ message: "Người dùng đã tồn tại!" });
        }

        const salt = await bcrypt.genSalt()                     //Ma hoa mat khau
        const hashPassword = await bcrypt.hash(password, salt)

        const newUser = new User({                              //Tao nguoi dung moi
            firstName,
            lastName,
            email,
            password: hashPassword,
        });
        await newUser.save()                                    //Luu nguoi dung moi

        res.status(200).json({ message: "Đăng ký thành công!", user: newUser })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: "Đăng ký thất bại!", error: err.message })
    }
})

router.post("/login", async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({ email })        //Kiem tra nguoi dung co ton tai bang email
        if (!user) {
            return res.status(400).json({ message: "Người dùng không tồn tại!" });
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) {
            return res.status(400).json({ message: "Mật khẩu không chính xác!" })
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
        delete user.password
        
        res.status(200).json({ token, user })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message})
    }
})

module.exports = router