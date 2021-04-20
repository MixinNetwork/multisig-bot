import axios from 'axios'

export const MXApi = axios.create({
  baseURL: "https://mixin-api.zeromesh.net/"
})

MXApi.interceptors.response.use(res => res.data.data)

export const ApiGetChains = () => MXApi.get(`/network`)
