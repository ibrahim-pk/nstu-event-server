const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route    POST api/posts
// @desc     Create a post
// @access   Private
router.post(
  '/',
  [
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
     // console.log(req.user)
      const user = await User.findById(req.body.user._id).select('-password');
     console.log(user)
      const newPost = new Post({
        text:req.body.text,
        name:req.body.user.name,
        avatar:req.body.user.avatar,
        user:req.body.user._id
      });

      const post = await newPost.save();
      res.status(200).send(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/posts
// @desc     Get all posts
// @access   Private
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete('/:id', async (req, res) => {
 // const id=req.params.id
  //console.log(id)
  try {
    const post = await Post.findByIdAndDelete({_id:req.params.id});
    console.log(post)
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
   // await post.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put('/like/:id', async (req, res) => {
  try {
    //console.log(req.body.userId._id)
   // console.log(req.body)
    const post = await Post.findById(req.params.id);
     //console.log(post)
    // Check if the post has already been liked
   let myLike= post.likes.filter(like =>like.user ===req.body.userId._id).length > 0
   //console.log(myLike)
    if (myLike) {
       res.status(200).send({ msg: 'Post already liked'});
    }else{
      post.likes.unshift({ user: req.body.userId._id });
      await post.save();
       res.status(200).send(post.likes);
    }

    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/unlike/:id
// @desc     Like a post
// @access   Private
router.put('/unlike/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if (
      post.likes.filter(like => like.user===req.body.userId._id).length ===
      0
    ) {
       res.status(200).json({ msg: 'Post has not yet been liked' });
    }

    // Get remove index
    const removeIndex = post.likes
      .map(like => like.user)
      .indexOf(req.body.userId._id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.status(200).send(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post('/comment/:id', async (req, res) => {
  //console.log(req.body)
    try {
      const post = await Post.findById(req.params.id);
       
      const newComment = {
        text: req.body.formData.text,
        name: req.body.userId.name,
        avatar:req.body.userId.avatar,
        user: req.body.userId._id
      };

      post.comments.unshift(newComment);

      await post.save();
      //console.log(post)
      res.status(200).send(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
       res.status(200).send({ msg: 'Comment does not exist' });
    }

    // // Check user
    // if (comment.user.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: 'User not authorized' });
    // }

    // Get remove index
    const removeIndex = post.comments
      .map(comment => comment.id)
      .indexOf(req.params.comment_id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.status(200).send(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
