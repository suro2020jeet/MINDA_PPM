sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/export/Spreadsheet",
	"sap/m/MessageToast",
	"com/minda/PPM/model/formatter"
], function (Controller, JSONModel, Filter, FilterOperator, Spreadsheet, MessageToast, formatter) {
	"use strict";

	return Controller.extend("com.minda.PPM.controller.PPM", {
		formatter: formatter,
		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("ppm").attachPatternMatched(this._onProductMatched, this);
		},
		_getAllPlants: function (vendorid) {
			jQuery.ajax({
				type: "GET",
				contentType: "application/x-www-form-urlencoded",
				headers: {
					"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
				},
				url: "/token/accounts/c70391893/vendor/plants?vendorId=" + vendorid,
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					this.plants = data.plants;
					// this.currPlant = this.plants.find(x => x.id === this.plant).name;
					var plantModel = new JSONModel(data);
					this.getOwnerComponent().setModel(plantModel, "plantModel");
					this._getPPMData();
				}.bind(this),
				error: function (data) {
					// console.log("error", data);
				}
			});
		},
		_getVendorName: function (role, user) {
			if (role === "Vendor") {
				jQuery.ajax({
					type: "GET",
					contentType: "application/x-www-form-urlencoded",
					headers: {
						"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
					},
					url: "/token/accounts/c70391893/users/groups?userId=" + user,
					async: false,
					success: function (data, textStatus, jqXHR) {
						var vendorid = data.groups[0].name;
						// data = JSON.stringify(data);
						this.getOwnerComponent().getModel("detailViewModel").setProperty("/vendor", vendorid);
						this._getAllPlants(vendorid);
					}.bind(this),
					error: function (data) {
						// console.log("error", data);
					}
				});

			}
		},
		_getCurrentUserRole: function (user) {
			jQuery.ajax({
				type: "GET",
				contentType: "application/x-www-form-urlencoded",
				headers: {
					"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
				},
				url: "/token/accounts/c70391893/users/roles?userId=" + user,

				async: false,
				success: function (data, textStatus, jqXHR) {
					var role = data.result.roles[0].name;
					if (role === "Admin" || role == "Purchase") {
						this.getView().getModel("detailViewModel").setProperty("/showAdvancedSearch", true);
						this._getPlantsForUser(user);
					} else {
						this.getView().getModel("detailViewModel").setProperty("/showAdvancedSearch", false);
						this._getVendorName(role, user);
					}
				}.bind(this),
				error: function (data) {
					// console.log("error", data);
				}
			});
		},
		_getPlantsForUser: function (user) {
			jQuery.ajax({
				type: "GET",
				contentType: "application/x-www-form-urlencoded",
				headers: {
					"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
				},
				url: "/token/accounts/c70391893/users/groups/plants?userId=" + user,
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					this.plants = data.plants;
					// this.currPlant = this.plants.find(x => x.id === this.plant).name;
					var plantModel = new JSONModel(data);
					this.getOwnerComponent().setModel(plantModel, "plantModel");
				}.bind(this),
				error: function (data) {
					// console.log("error", data);
				}
			});
		},
		_getUserDetails: function () {
			jQuery.ajax({
				type: "GET",
				contentType: "application/json",
				url: "/services/userapi/currentUser",
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					//debugger;
					var user = data.name,
						name = data.firstName;
					user = "Delhi@shankarmoulding.com";
					// user = "akmalhotra@mindagroup.com";
					this._getCurrentUserRole(user);
				}.bind(this)
			});

		},
		_onProductMatched: function (oEvent) {
			var date = new Date();
			var FirstDay = new Date(date.getFullYear(), date.getMonth() - 1, date.getDate());
			this.getOwnerComponent().setModel(new JSONModel({
				fullScreenButtonVisible: true,
				busy: true,
				exitFSButtonVisible: false,
				fromDate: FirstDay,
				toDate: date,
				plant: "1031",
				vendor: "0000200323",
				showAdvancedSearch: false
			}), "detailViewModel");
			if (!sap.ushell) {} else {
				if (sap.ui.getCore().plants != undefined) {
					if (sap.ui.getCore().plants.hasOwnProperty("plant")) {
						if (sap.ui.getCore().plants.plant) {
							this.getOwnerComponent().getModel("detailViewModel").setProperty("/plant", sap.ui.getCore().plants.plant);
							this._getPPMData();
						}
					}
					sap.ui.getCore().plants.registerListener(function (val) {
						if (val) {
							this.getOwnerComponent().getModel("detailViewModel").setProperty("/plant", val);
							this._getPPMData();
						}
					}.bind(this));
				}
			}
			// this._getUserDetails();
			// this._getPPMData();
		},
		handleDateRangeChange: function (oEvent) {
			var Difference_In_Time = oEvent.getSource().getSecondDateValue().getTime() - oEvent.getSource().getDateValue().getTime();
			var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
			if (Difference_In_Days > 31) {
				return MessageToast.show("Can not select more than 31 days...");
			}
			this.getOwnerComponent().getModel("detailViewModel").setProperty("/busy", true);
			this.getOwnerComponent().getModel("detailViewModel").setProperty("/fromDate", oEvent.getSource().getDateValue());
			this.getOwnerComponent().getModel("detailViewModel").setProperty("/toDate", oEvent.getSource().getSecondDateValue());
			this._getPPMData();
			
		},
		_getPPMData: function () {
			var filter = [];
			filter.push(new sap.ui.model.Filter("VendorCode", sap.ui.model.FilterOperator.EQ, this.getOwnerComponent().getModel(
				"detailViewModel").getProperty("/vendor")));
			filter.push(new sap.ui.model.Filter("PlantCode", sap.ui.model.FilterOperator.EQ, this.getOwnerComponent().getModel(
				"detailViewModel").getProperty("/plant")));
			filter.push(new sap.ui.model.Filter("PageSize", sap.ui.model.FilterOperator.EQ, "20"));
			filter.push(new sap.ui.model.Filter("PageNumber", sap.ui.model.FilterOperator.EQ, "1"));
			filter.push(new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.BT, this.getOwnerComponent().getModel(
				"detailViewModel").getProperty("/fromDate"), this.getOwnerComponent().getModel(
				"detailViewModel").getProperty("/toDate")));
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				this.getOwnerComponent().getModel().read("/PPMStatusSet", {
					filters: filter,
					success: function (oData) {
						debugger
						if (oData.results.length == 0) {
							this.getOwnerComponent().getModel("detailViewModel").setProperty("/items", []);
							this.getOwnerComponent().getModel("detailViewModel").setProperty("/tableTitle", "PPM (0)");
						} else {
							this.getOwnerComponent().getModel("detailViewModel").setProperty("/items", oData.results);
							this.getOwnerComponent().getModel("detailViewModel").setProperty("/tableTitle", "PPMs (" + oData.results.length + ")");
						}
						this.getOwnerComponent().getModel("detailViewModel").setProperty("/Plant", "MIL - LIGHTING MANESAR(1031)");
						this.getOwnerComponent().getModel("detailViewModel").setProperty("/busy", false);
					}.bind(this),
					error: function (oError) {

					}.bind(this)
				});

			}.bind(this));
		},
		onMaterialCodeSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("MaterialCode", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table").getBinding("items").filter(oTableSearchState, "Application");
		},
		onMaterialNameSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("MaterialName", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table").getBinding("items").filter(oTableSearchState, "Application");
		},
		onPressDownload: function () {
			var aColm = [{
				label: "MATERIAL CODE",
				property: "MaterialCode",
				type: "string"
			}, {
				label: "MATERIAL NAME",
				property: "MaterialName",
				type: "string"
			}, {
				label: "DELIVERED QTY",
				property: "DeliveredQty",
				type: "string",
			}, {
				label: "REJECTION QTY",
				property: "RejectionQuantity",
				type: "string"
			}, {
				label: "PPM",
				property: "Ppm",
				type: "string"
			}, {
				label: "PLANT CODE",
				property: "PlantCode",
				type: "string"
			}, {
				label: "PLANT NAME",
				property: "PlantName",
				type: "string"
			}, {
				label: "VENDOR CODE",
				property: "VendorCode",
				type: "string"
			}, {
				label: "VENDOR NAME",
				property: "VendorName",
				type: "string"
			}];

			var dataResults = "";

			var oSettings = {
				workbook: {
					columns: aColm,
					hierarchyLevel: 'Level'
				},
				fileName: "PPM",
				dataSource: this.getOwnerComponent().getModel("detailViewModel").getData().items

			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					MessageToast.show('Spreadsheet export has finished');
				})
				.finally(function () {
					oSheet.cancel();
				});
		},
		onPressAdvancedSearch: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("com.minda.PPM.fragments.AdvancedSearch", this);
				this.getView().addDependent(this._oDialog);
			}
			this._oDialog.open();
		},
		onChangePlant: function (oEvent) {
			debugger;
			this.getView().getModel("detailViewModel").setProperty("/plant", oEvent.getSource().getSelectedItem().getKey());
			jQuery.ajax({
				type: "GET",
				contentType: "application/x-www-form-urlencoded",
				headers: {
					"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
				},
				url: "/token/accounts/c70391893/plant/vendors?plantId=" + oEvent.getSource().getSelectedItem().getKey(),
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					this.plants = data.plants;
					this.getOwnerComponent().setModel(new JSONModel(data), "vendorModel");
				}.bind(this),
				error: function (data) {
					// console.log("error", data);
				}
			});
		},
		onChangeVendor: function (oEvent) {
			this.getView().getModel("detailViewModel").setProperty("/vendor", oEvent.getSource().getSelectedItem().getKey());
		},
		onPressCloseDialog: function () {
			this._oDialog.close();
		},
		onPressApply: function () {
			this._oDialog.close();
			this._getPPMData();
		}

	});

});