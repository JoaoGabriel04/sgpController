import {Router} from "express"
import sessionRouter from "./session.route"
import propRouter from "./propriedade.route"
import userRouter from "./user.route"
import histRouter from "./historico.route"
import bancoRouter from "./banco.route"

const apiRouter = Router()

apiRouter.use("/sessions", sessionRouter)
apiRouter.use("/propriedades", propRouter)
apiRouter.use("/user", userRouter)
apiRouter.use("/historico", histRouter)
apiRouter.use("/banco", bancoRouter)

export default apiRouter