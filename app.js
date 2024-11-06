const express=require('express');
const movies=require('./movies.json');
const app=express();
const cors = require('cors')
const crypto=require('node:crypto');
const { validateMovie, validatePartialMovie } = require('./schemas/movies');
app.disable('x-powered-by');


app.use(express.json()); // Middleware para procesar todas las peticiones de la app para que se ejecute antes de las rutas
app.get('/',(req,res)=>{
res.json({message:'Hello World'})    
})

app.use(cors())

//Todos los recursos que sean MOVIES se identifican con /movies
app.get('/movies',(req,res)=>{
  res.header('Access-Control-Allow-Origin','*');
  const {method, url}=req
  console.log(`Peticion hecha a ${url} con el metodo ${method}`);
  
  
    const {genre}=req.query;
    if(genre){
        const filterdMovies=movies.filter( movie=>movie.genre.some(g=>g.toLowerCase()===genre.toLowerCase()))
        return res.send(filterdMovies);
    }
 
res.json(movies);

})
app.get('/movies/:id',(req,res)=>{ //path-to-regex hace que el id sea dinamico en la url de la peticion 
    const {id}=req.params;

    const movie=movies.find(movie=>movie.id===id)
    if (movie) return res.json(movie);
    res.status(404).json({message:'Movie not found'});
})

//Post con validacion en el body schema de movies con zod
app.post('/movies', (req, res) => {
    const result = validateMovie(req.body)
  
    if (!result.success) {
      // 422 Unprocessable Entity
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
  
    // en base de datos
    const newMovie = {
      id: crypto.randomUUID(), // uuid v4
      ...result.data// extraemos el resto de la informacion del body y lo guardamos en newMovie
    }
  
    // Esto no sería REST, porque estamos guardando
    // el estado de la aplicación en memoria
    movies.push(newMovie)
    console.log(movies);
    
  
    res.status(201).json(newMovie)
  })

  //Delete para eliminar un recurso
  app.delete('/movies/:id', (req, res) => {
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)
  
    if (movieIndex === -1) {
      return res.status(404).json({ message: 'Movie not found' })
    }
  
    movies.splice(movieIndex, 1)//El 1 es el numero de elementos a eliminar 
  
    return res.json({ message: 'Movie deleted' })
  })

//Patch para actualizar un recurso
app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})




const PORT=process.env.PORT??1234

app.listen(PORT,()=>{
    console.log(`Server listening on port http://localhost:${PORT}`);
})