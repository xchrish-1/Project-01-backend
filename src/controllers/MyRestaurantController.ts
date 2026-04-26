import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import Order from "../models/order";

type MenuItemRequest = {
  _id?: string;
  name: string;
  price: number;
  imageUrl?: string;
};

const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching restaurant" });
  }
};

const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    const existingRestaurant = await Restaurant.findOne({ user: req.userId });

    if (existingRestaurant) {
      return res
        .status(409)
        .json({ message: "User restaurant already exists" });
    }

    const uploadedFiles = getUploadedFiles(req);
    const restaurantImageFile = findUploadedFile(uploadedFiles, "imageFile");

    if (!restaurantImageFile) {
      return res.status(400).json({ message: "Restaurant image is required" });
    }

    const imageUrl = await uploadImage(restaurantImageFile);
    const menuItems = await mapMenuItemsWithImages(
      req.body.menuItems,
      uploadedFiles
    );

    const restaurant = new Restaurant({
      ...req.body,
      menuItems,
    });
    restaurant.imageUrl = imageUrl;
    restaurant.user = new mongoose.Types.ObjectId(req.userId);
    restaurant.lastUpdated = new Date();
    await restaurant.save();

    res.status(201).send(restaurant);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({
      user: req.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    const uploadedFiles = getUploadedFiles(req);
    const restaurantImageFile = findUploadedFile(uploadedFiles, "imageFile");
    const menuItems = await mapMenuItemsWithImages(
      req.body.menuItems,
      uploadedFiles
    );

    restaurant.set({
      restaurantName: req.body.restaurantName,
      city: req.body.city,
      country: req.body.country,
      deliveryPrice: req.body.deliveryPrice,
      estimatedDeliveryTime: req.body.estimatedDeliveryTime,
      cuisines: req.body.cuisines,
      menuItems,
      lastUpdated: new Date(),
    });

    if (restaurantImageFile) {
      const imageUrl = await uploadImage(restaurantImageFile);
      restaurant.imageUrl = imageUrl;
    }

    await restaurant.save();
    res.status(200).send(restaurant);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const getMyRestaurantOrders = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("restaurant")
      .populate("user");

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }

    const restaurant = await Restaurant.findById(order.restaurant);

    if (restaurant?.user?._id.toString() !== req.userId) {
      return res.status(401).send();
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "unable to update order status" });
  }
};

const uploadImage = async (file: Express.Multer.File) => {
  const image = file;
  const base64Image = Buffer.from(image.buffer).toString("base64");
  const dataURI = `data:${image.mimetype};base64,${base64Image}`;

  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
  return uploadResponse.url;
};

const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  if (!req.files) {
    return [];
  }

  if (Array.isArray(req.files)) {
    return req.files;
  }

  return Object.values(req.files).flat();
};

const findUploadedFile = (
  files: Express.Multer.File[],
  fieldName: string
) => {
  return files.find((file) => file.fieldname === fieldName);
};

const mapMenuItemsWithImages = async (
  menuItems: MenuItemRequest[],
  uploadedFiles: Express.Multer.File[]
) => {
  return Promise.all(
    menuItems.map(async (menuItem, index) => {
      const imageFile = findUploadedFile(
        uploadedFiles,
        `menuItems[${index}][imageFile]`
      );
      const imageUrl = imageFile
        ? await uploadImage(imageFile)
        : menuItem.imageUrl;

      return {
        ...(menuItem._id ? { _id: menuItem._id } : {}),
        name: menuItem.name,
        price: Number(menuItem.price),
        ...(imageUrl ? { imageUrl } : {}),
      };
    })
  );
};

export default {
  updateOrderStatus,
  getMyRestaurantOrders,
  getMyRestaurant,
  createMyRestaurant,
  updateMyRestaurant,
};
