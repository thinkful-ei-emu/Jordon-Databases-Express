const path = require('path');
const express = require('express');
const BookmarksService = require('./bookmarks-service');
const xss = require('xss');

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const BookmarkTemp = bookmark => ({
    id: bookmark.id,
    title: bookmark.title,
    url: xss(bookmark.url),
    description: xss(bookmark.description),
    rating: bookmark.rating,
})

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks.map(BookmarkTemp))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const knexInstance = req.app.get('db');
        //defracture req body
        const { title, url, description, rating } = req.body
        //Bookmark object with generated Id to /post
        const newBookmark = { title, url, description, rating }

        BookmarksService.insertBookmark(knexInstance, newBookmark)
            .then(bookmark => {
                res
                    .status(201)
                    .location(`/${bookmark.id}`)
                    .json(BookmarkTemp(bookmark))
            })
            .catch(next)
    })




bookmarksRouter
    .route('/:bookmark_id')
    .all((req, res, next) => {
        BookmarksService.getById(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(bookmark => {
                console.log(req.params.bookmark_id)
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: 'Article does not exist' }
                    })
                }
                res.bookmark = bookmark
                next()
            })
            .catch(next)
    })
    .get((req, res, nest) => {
        res.send(BookmarkTemp(res.bookmark))
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(row => {
                res.status(204).end();
            })
            .catch(next)
    });

module.exports = { bookmarksRouter }