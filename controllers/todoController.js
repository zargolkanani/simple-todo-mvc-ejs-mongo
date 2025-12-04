const Todo = require("../models/Todo");
const NodeCache = require("node-cache");

const cacheTTL = parseInt(process.env.CACHE_TTL, 10) || 20; // ثانیه
const cache = new NodeCache({ stdTTL: cacheTTL, checkperiod: cacheTTL * 0.2 });

/**
 * لیست کارها با پشتیبانی از فیلتر status و search
 * از کش استفاده میشود — key بر اساس query ساخته می‌شود
 */
module.exports.getTodos = async (req, res) => {
  try {
    // ساخت filter از query params
    const filter = {};
    const { status, search } = req.query;

    if (status && (status === "pending" || status === "done")) filter.status = status;
    if (search && search.trim()) filter.title = { $regex: search.trim(), $options: "i" };

    const cacheKey = JSON.stringify({ filter, sort: "-createdAt" , page: req.query.page || 1});

    // از کش بخوانیم اگر موجود است
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.render("index", {
        todos: cached,
        title: "Todo List (Cached)",
        search: search || "",
        selectedStatus: status || ""
      });
    }

    const todos = await Todo.find(filter).sort({ createdAt: -1 }).lean();

    // ذخیره در کش
    cache.set(cacheKey, todos);

    res.render("index", { todos, title: "Todo List", search: search || "", selectedStatus: status || "" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

module.exports.addTodo = async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    if (!title) {
      return res.redirect("/");
    }
    await Todo.create({ title });
    cache.flushAll(); // پاک کردن کش بعد از تغییر داده
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

module.exports.deleteTodo = async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    cache.flushAll();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

module.exports.editTodoForm = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id).lean();
    if (!todo) return res.status(404).send("Todo not found");
    res.render("edit", { todo, title: "Edit Todo" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

module.exports.updateTodo = async (req, res) => {
  try {
    const update = {
      title: req.body.title ? req.body.title.trim() : undefined,
      status: req.body.status
    };

    // حذف فیلدهای undefined
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

    await Todo.findByIdAndUpdate(req.params.id, update, { new: true });
    cache.flushAll();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
