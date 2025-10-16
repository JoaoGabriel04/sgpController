import {Router} from "express"
import sessionRouter from "./session.route.js"
import propRouter from "./propriedade.route.js"
import userRouter from "./user.route.js"
import histRouter from "./historico.route.js"
import bancoRouter from "./banco.route.js"

const apiRouter = Router()

apiRouter.use("/sessions", sessionRouter)
apiRouter.use("/propriedades", propRouter)
apiRouter.use("/user", userRouter)
apiRouter.use("/historico", histRouter)
apiRouter.use("/banco", bancoRouter)

export default apiRouter